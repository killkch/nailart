import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * app/api/checkout/verify/route.ts
 *
 * Polar 결제 세션 검증 및 크레딧 즉시 충전 엔드포인트
 * ─────────────────────────────────────────────────────────────
 * [해결 배경 및 핵심 역할]
 * 1. 로컬 개발 환경(localhost) 한계 극복:
 *    - 로컬 환경에서는 Polar 서버의 웹훅이 localhost:3000에 닿지 못합니다.
 *    - 따라서 사용자가 결제창에서 결제를 마치고 대시보드로 복귀할 때 전달받는
 *      session_id를 통해 서버에서 Polar API로 결제 완료 여부를 직접 검증하고 즉시 크레딧을 충전합니다.
 *
 * 2. 멱등성 (중복 충전 방지):
 *    - payments 테이블에 이미 해당 polar_checkout_id가 'succeeded'로 기록되어 있는지 확인하여
 *      새로고침을 하거나 재요청하더라도 1회의 결제에 1번만 정확히 충전되도록 보호합니다.
 *
 * 3. 원자적 크레딧 증액:
 *    - 기존 크레딧(예: 99개)에 신규 결제 크레딧(100개 또는 300개)을 안전하게 합산(99 + 100 = 199)합니다.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'POLAR_ACCESS_TOKEN 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const polarServer = (process.env.POLAR_SERVER as 'sandbox' | 'production') || 'sandbox';
    const polar = new Polar({
      accessToken: accessToken,
      server: polarServer,
    });

    const proProductId = (
      process.env.POLAR_PRO_PRODUCT_ID ||
      process.env.POLAR_PRODUCT_ID_PRO ||
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_PRO
    )?.trim();
    const ultraProductId = (
      process.env.POLAR_ULTRA_PRODUCT_ID ||
      process.env.POLAR_PRODUCT_ID_ULTRA ||
      process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_ULTRA
    )?.trim();

    // 1. 현재 세션 사용자 확인 (선택 사항 - 세션이 없어도 결제 데이터에서 역추적)
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    // ── CASE A: 특정 session_id 검증 요청 ───────────────────────
    if (sessionId) {
      // 2. Polar API로 결제 세션 상세 정보 조회
      const checkoutSession = await polar.checkouts.get({ id: sessionId });

      if (!checkoutSession) {
        return NextResponse.json(
          { error: '결제 세션을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const status = checkoutSession.status;
      // Polar 결제 성공 상태는 'confirmed' 또는 'succeeded'
      const isPaid = status === 'confirmed' || status === 'succeeded';

      if (!isPaid) {
        return NextResponse.json({
          success: false,
          status,
          message: '아직 결제가 완료되지 않은 세션입니다.',
        });
      }

      // 유저 ID 식별
      let targetUserId =
        sessionUser?.id ||
        checkoutSession.externalCustomerId ||
        checkoutSession.metadata?.userId ||
        checkoutSession.metadata?.user_id;

      if (!targetUserId && checkoutSession.customerEmail) {
        const { data: userRec } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', checkoutSession.customerEmail)
          .maybeSingle();
        targetUserId = userRec?.id;
      }

      if (!targetUserId) {
        return NextResponse.json(
          { error: '결제 고객의 사용자 정보를 찾을 수 없습니다.' },
          { status: 400 }
        );
      }

      // 3. 중복 충전 방지: payments 테이블에 이미 기록되어 있는지 확인
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('id, credits_added, status')
        .eq('polar_checkout_id', sessionId)
        .eq('status', 'succeeded')
        .maybeSingle();

      if (existingPayment) {
        // 이미 크레딧 충전이 완료된 건이므로 중복 충전하지 않고 현재 유저 상태 반환
        const { data: currentUser } = await supabaseAdmin
          .from('users')
          .select('credits, plan')
          .eq('id', targetUserId)
          .single();

        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          credits: currentUser?.credits || 0,
          plan: currentUser?.plan || 'pro',
          message: '이미 충전이 완료된 결제 건입니다.',
        });
      }

      // 4. 구매 상품 플랜 및 충전량 판별
      const productId = checkoutSession.productId || checkoutSession.products?.[0];
      const amount = Number(checkoutSession.amount || 20000);

      let plan: 'pro' | 'ultra' = 'pro';
      let creditsToAdd = 100;

      if (productId === ultraProductId || amount >= 40000) {
        plan = 'ultra';
        creditsToAdd = 300;
      } else {
        plan = 'pro';
        creditsToAdd = 100;
      }

      // 5. 유저 크레딧 원자적 증액 (increment_user_credits)
      const { data: updatedData, error: rpcError } = await supabaseAdmin.rpc(
        'increment_user_credits',
        {
          target_user_id: targetUserId,
          add_amount: creditsToAdd,
          new_plan: plan,
        }
      );

      let newCredits = 0;
      if (!rpcError && updatedData && updatedData.length > 0) {
        newCredits = updatedData[0].updated_credits;
      } else {
        // Fallback 직접 업데이트
        const { data: currentUser } = await supabaseAdmin
          .from('users')
          .select('credits')
          .eq('id', targetUserId)
          .single();

        newCredits = (currentUser?.credits || 0) + creditsToAdd;
        await supabaseAdmin
          .from('users')
          .update({
            credits: newCredits,
            plan: plan,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);
      }

      // 6. payments 테이블에 결제 성공 기록 영구 저장
      await supabaseAdmin.from('payments').insert({
        user_id: targetUserId,
        amount: amount,
        currency: (checkoutSession.currency || 'KRW').toUpperCase(),
        status: 'succeeded',
        plan: plan,
        credits_added: creditsToAdd,
        polar_checkout_id: sessionId,
      });

      console.log(
        `[Checkout Verify] 세션(${sessionId}) 검증 성공! 유저(${targetUserId}) 크레딧 충전 완료: +${creditsToAdd} ➔ 총 ${newCredits}`
      );

      return NextResponse.json({
        success: true,
        creditsAdded: creditsToAdd,
        totalCredits: newCredits,
        plan: plan,
      });
    }

    // ── CASE B: 미반영된 최근 결제 세션 일괄 동기화 (Sync) ───────
    if (!sessionUser?.id) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const checkoutsList = await polar.checkouts.list({ limit: 10 });
    const userConfirmedCheckouts = (checkoutsList.result?.items || []).filter(
      (c) =>
        (c.status === 'confirmed' || c.status === 'succeeded') &&
        (c.externalCustomerId === sessionUser.id || c.customerEmail === sessionUser.email)
    );

    let totalSyncedCredits = 0;
    for (const item of userConfirmedCheckouts) {
      const { data: alreadyDone } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('polar_checkout_id', item.id)
        .eq('status', 'succeeded')
        .maybeSingle();

      if (!alreadyDone) {
        const itemAmount = Number(item.amount || 20000);
        const itemPlan =
          item.productId === ultraProductId || itemAmount >= 40000 ? 'ultra' : 'pro';
        const itemCredits = itemPlan === 'ultra' ? 300 : 100;

        await supabaseAdmin.rpc('increment_user_credits', {
          target_user_id: sessionUser.id,
          add_amount: itemCredits,
          new_plan: itemPlan,
        });

        await supabaseAdmin.from('payments').insert({
          user_id: sessionUser.id,
          amount: itemAmount,
          currency: (item.currency || 'KRW').toUpperCase(),
          status: 'succeeded',
          plan: itemPlan,
          credits_added: itemCredits,
          polar_checkout_id: item.id,
        });

        totalSyncedCredits += itemCredits;
      }
    }

    const { data: finalUser } = await supabaseAdmin
      .from('users')
      .select('credits, plan')
      .eq('id', sessionUser.id)
      .single();

    return NextResponse.json({
      success: true,
      syncedCredits: totalSyncedCredits,
      currentCredits: finalUser?.credits || 0,
      plan: finalUser?.plan || 'pro',
    });
  } catch (error: any) {
    console.error('[Checkout Verify] 검증 중 오류 발생:', error);
    return NextResponse.json(
      { error: error?.message || '결제 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
