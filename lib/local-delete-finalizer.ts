const LOCAL_DELETE_ACK_TIMEOUT_MS = 1_500;

export interface LocalDeleteFinalizer {
  markLocalDeleteApplied: () => void;
  waitForCommit: (commit: Promise<void>) => Promise<void>;
  didNavigate: () => boolean;
}

/**
 * Firestore applies writes locally before its server acknowledgement arrives.
 * Keep an actual rejection on the detail page, but do not trap a user there
 * when the live parent listener has already observed the local deletion.
 */
export const createLocalDeleteFinalizer = (onNavigate: () => void): LocalDeleteFinalizer => {
  let localDeleteApplied = false;
  let acknowledgementTimedOut = false;
  let navigated = false;
  let timeout: number | undefined;
  let resolveCompletion: (() => void) | undefined;

  const navigateOnce = () => {
    if (navigated) return;
    navigated = true;
    if (timeout) window.clearTimeout(timeout);
    onNavigate();
    resolveCompletion?.();
  };

  return {
    markLocalDeleteApplied: () => {
      localDeleteApplied = true;
      if (acknowledgementTimedOut) navigateOnce();
    },
    waitForCommit: (commit) => new Promise((resolve, reject) => {
      resolveCompletion = resolve;
      timeout = window.setTimeout(() => {
        acknowledgementTimedOut = true;
        if (localDeleteApplied) navigateOnce();
      }, LOCAL_DELETE_ACK_TIMEOUT_MS);
      commit.then(
        () => navigateOnce(),
        (error) => {
          if (navigated) {
            console.error('Firestore deletion acknowledgement failed after local navigation.', error);
            return;
          }
          if (timeout) window.clearTimeout(timeout);
          reject(error);
        }
      );
    }),
    didNavigate: () => navigated,
  };
};
