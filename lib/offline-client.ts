export interface OfflineStatus { count: number; revision: string; checkedAt: string }

export async function offlineCommand(command: string): Promise<OfflineStatus | null> {
  if (!("serviceWorker" in navigator)) throw new Error("Offline storage is not supported by this browser.");
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Offline access is available after installing the production update. Reload and try again.")), 8000)),
  ]);
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => { channel.port1.close(); reject(new Error("The download timed out. Please try again.")); }, 60000);
    channel.port1.onmessage = ({ data }) => {
      clearTimeout(timeout);
      channel.port1.close();
      if (data.ok) resolve(data.status);
      else reject(new Error(data.error));
    };
    registration.active?.postMessage({ type: "HYMN_OFFLINE", command }, [channel.port2]);
  });
}
