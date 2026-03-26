/**
 * Gather Plugin SDK (local copy for FLPaint)
 *
 * Communicates with the Gather host via postMessage and proxied REST calls.
 */

export interface Plot {
  id: string;
  name: string;
  driveFolderId: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime: string;
}

interface GatherResponse {
  type: "gather:response";
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export class GatherPlugin {
  private token: string;
  private baseUrl: string;
  private pendingRequests = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private requestCounter = 0;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.token = params.get("token") ?? "";

    // The Gather host passes its origin as hostUrl so proxy API calls
    // go to the correct server (not the plugin's own origin).
    const hostUrl = params.get("hostUrl");
    if (hostUrl) {
      this.baseUrl = hostUrl;
    } else if (window.parent !== window && document.referrer) {
      this.baseUrl = new URL(document.referrer).origin;
    } else {
      this.baseUrl = window.location.origin;
    }

    window.addEventListener("message", this.handleMessage.bind(this));
    this.postToHost("gather:ready", {});
  }

  // --- Public API ---

  async pickPlot(options?: {
    mode?: "input" | "output";
    title?: string;
  }): Promise<Plot> {
    return this.postToHost("gather:pickPlot", {
      mode: options?.mode ?? "input",
      title: options?.title ?? "Select a plot",
    }) as Promise<Plot>;
  }

  async listFiles(plotId: string): Promise<DriveFile[]> {
    // Route through postMessage so the host (which has the session cookie)
    // makes the API call — avoids cross-site cookie issues.
    const res = await this.postToHost("gather:listFiles", { plotId });
    return (res as { files: DriveFile[] }).files;
  }

  /**
   * Proxy an image URL through the Gather server-side proxy.
   * Returns a base64 data URL. Used for Google Drive thumbnails.
   */
  /**
   * Upload a file to a plot via the Gather host.
   * Accepts a base64 data URL. Returns the file ID.
   */
  async uploadFile(
    plotId: string,
    fileName: string,
    dataUrl: string
  ): Promise<{ fileId: string; thumbnailUrl: string }> {
    const res = await this.postToHost("gather:uploadFile", {
      plotId,
      fileName,
      dataUrl,
    });
    return res as { fileId: string; thumbnailUrl: string };
  }

  async proxyImageUrl(url: string): Promise<string> {
    const res = await this.postToHost("gather:proxyImage", { url });
    return (res as { dataUrl: string }).dataUrl;
  }

  async listPlots(): Promise<Plot[]> {
    const res = await this.proxyFetch("/api/plugin-proxy/plots");
    return (res as { plots: Plot[] }).plots;
  }


  // --- Internal ---

  private postToHost(
    type: string,
    payload: Record<string, unknown>
  ): Promise<unknown> {
    const requestId = `req_${++this.requestCounter}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      window.parent.postMessage({ type, requestId, payload }, "*");

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request ${type} timed out`));
        }
      }, 60_000);
    });
  }

  private handleMessage(event: MessageEvent) {
    const msg = event.data as GatherResponse;
    if (msg?.type !== "gather:response" || !msg.requestId) return;

    const pending = this.pendingRequests.get(msg.requestId);
    if (!pending) return;

    this.pendingRequests.delete(msg.requestId);

    if (msg.ok) {
      pending.resolve(msg.data);
    } else {
      pending.reject(new Error(msg.error ?? "Request failed"));
    }
  }

  private async proxyFetch(
    path: string,
    init?: RequestInit
  ): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...((init?.headers as Record<string, string>) ?? {}),
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        body?.error ?? `Request failed with status ${res.status}`
      );
    }

    return res.json();
  }
}
