import { useRef, useState, useCallback, useEffect } from "react";

export type TwitchStatus = "disconnected" | "connecting" | "connected" | "error";

export interface TwitchConfig {
  channel: string;
  username: string;
  token: string; // OAuth token WITHOUT the "oauth:" prefix
}

const IRC_URL = "wss://irc-ws.chat.twitch.tv:443";

export function useTwitchChat() {
  const ws = useRef<WebSocket | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<TwitchStatus>("disconnected");
  const [config, setConfig] = useState<TwitchConfig>(() => {
    if (typeof window === "undefined") return { channel: "", username: "", token: "" };
    try {
      const saved = localStorage.getItem("twitch_config");
      return saved ? JSON.parse(saved) : { channel: "", username: "", token: "" };
    } catch {
      return { channel: "", username: "", token: "" };
    }
  });

  const disconnect = useCallback(() => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    if (ws.current) {
      ws.current.onclose = null; // prevent state update on intentional close
      ws.current.close();
      ws.current = null;
    }
    setStatus("disconnected");
  }, []);

  const connect = useCallback((cfg: TwitchConfig) => {
    // Persist config to localStorage (token stays local to the user's browser)
    localStorage.setItem("twitch_config", JSON.stringify(cfg));
    setConfig(cfg);

    if (ws.current) disconnect();

    setStatus("connecting");

    const socket = new WebSocket(IRC_URL);
    ws.current = socket;

    socket.onopen = () => {
      socket.send("CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands");
      socket.send(`PASS oauth:${cfg.token}`);
      socket.send(`NICK ${cfg.username.toLowerCase()}`);
      socket.send(`JOIN #${cfg.channel.toLowerCase()}`);
    };

    socket.onmessage = (event: MessageEvent) => {
      const data: string = event.data;

      // Keepalive
      if (data.startsWith("PING")) {
        socket.send("PONG :tmi.twitch.tv");
        return;
      }

      // Successful JOIN
      if (data.includes("JOIN")) {
        setStatus("connected");
        // Start keepalive ping every 4 minutes
        if (pingInterval.current) clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("PING :tmi.twitch.tv");
          }
        }, 4 * 60 * 1000);
      }

      // Auth failure
      if (data.includes("NOTICE") && (data.includes("Login authentication failed") || data.includes("Improperly formatted auth"))) {
        setStatus("error");
        disconnect();
      }
    };

    socket.onerror = () => {
      setStatus("error");
    };

    socket.onclose = () => {
      setStatus("disconnected");
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
    };
  }, [disconnect]);

  const sendMessage = useCallback((message: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(`PRIVMSG #${config.channel.toLowerCase()} :${message}`);
  }, [config.channel]);

  // Auto-connect if config is available on mount
  useEffect(() => {
    if (config.channel && config.username && config.token && status === "disconnected") {
      connect(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { status, config, connect, disconnect, sendMessage };
}
