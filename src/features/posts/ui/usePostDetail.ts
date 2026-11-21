import { useCallback, useEffect, useState } from 'react';

import { useServices } from '../../../app/ServicesContext';
import type { AppError } from '../../../core/error/appError';
import type { Comment } from '../domain/comment';
import type { Post } from '../domain/post';

export type PostDetailState =
  | { status: 'loading' }
  | { status: 'error'; error: AppError }
  | { status: 'loaded'; post: Post; comments: Comment[]; commentsError?: AppError };

/**
 * Local async state in a hook (no Redux) for a simple screen. Contrast with
 * the posts slice when asked "when do you NOT put something in Redux?".
 */
export function usePostDetail(postId: number) {
  const { postRepository } = useServices();
  const [state, setState] = useState<PostDetailState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Aborting on unmount (or id change) cancels the requests, so no state
    // update ever lands on an unmounted screen and a stale post never shows.
    const controller = new AbortController();
    (async () => {
      setState({ status: 'loading' });
      // Parallel: the post and its comments load together.
      const [postResult, commentsResult] = await Promise.all([
        postRepository.getPost(postId, controller.signal),
        postRepository.getComments(postId, controller.signal),
      ]);
      if (controller.signal.aborted) return;
      if (!postResult.ok) {
        setState({ status: 'error', error: postResult.error });
        return;
      }
      setState({
        status: 'loaded',
        post: postResult.data,
        comments: commentsResult.ok ? commentsResult.data : [],
        // Comments are secondary: their failure does not fail the screen.
        commentsError: commentsResult.ok ? undefined : commentsResult.error,
      });
    })();
    return () => controller.abort();
  }, [postRepository, postId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
