import { handleOptions, parseJsonBody, jsonResponse, errorResponse } from '../_shared/http.ts';
import { requireAuthenticatedUser } from '../_shared/supabase.ts';
import { getRedis } from '../_shared/upstash.ts';

interface FollowUserRequest {
  targetUserId: string;
  action?: 'follow' | 'unfollow';
  source?: 'recommendation' | 'profile' | 'feed' | 'search';
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const { userId, adminClient } = await requireAuthenticatedUser(request);
    const body = await parseJsonBody<FollowUserRequest>(request);
    const action = body.action ?? 'follow';

    if (!body.targetUserId) {
      throw new Error('targetUserId is required.');
    }

    if (action === 'follow') {
      const { error } = await adminClient.rpc('follow_user_atomic', {
        p_follower_id: userId,
        p_following_id: body.targetUserId,
      });

      if (error) {
        throw error;
      }

      await adminClient.from('interactions').insert({
        user_id: userId,
        target_type: 'user',
        target_id: body.targetUserId,
        action_type: body.source === 'recommendation' ? 'follow_from_recommendation' : 'follow',
      });
    } else {
      const { error } = await adminClient.rpc('unfollow_user_atomic', {
        p_follower_id: userId,
        p_following_id: body.targetUserId,
      });

      if (error) {
        throw error;
      }
    }

    const redis = getRedis();
    if (redis) {
      await Promise.all([
        redis.del(`feed:${userId}`),
        redis.del(`feedmeta:${userId}`),
        redis.del(`recs:${userId}`),
        redis.del(`recs:${body.targetUserId}`),
        redis.del(`counts:${userId}`),
        redis.del(`counts:${body.targetUserId}`),
      ]);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
});