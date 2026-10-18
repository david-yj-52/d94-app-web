"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {SOLACE_CONFIG, TOPICS} from "./solaceConfig";

export interface SolaceMessage {
    id: string;
    topic: string;
    payload: string;
    timestamp: Date;
    direction: "sent" | "received";
    selectorKey?: string;
}

type PendingRequest = {
    resolve: (payload: string) => void;
    reject: (reason: string) => void;
    timer: ReturnType<typeof setTimeout>;
};

export function useSolace() {
    const sessionRef = useRef<any>(null);
    const solaceRef = useRef<any>(null);
    const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
    const isSubscribedRef = useRef<boolean>(false); // ✅ Topic 구독 여부

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [messages, setMessages] = useState<SolaceMessage[]>([]);
    const [error, setError] = useState<string | null>(null);

    // ──────────────────────────────────────────────
    // loadSolace
    // ──────────────────────────────────────────────
    const loadSolace = useCallback(async () => {
        if (solaceRef.current) return solaceRef.current;
        if (typeof window === "undefined") return null;

        const solace = await import("solclientjs");
        const factoryProps = new solace.SolclientFactoryProperties();
        factoryProps.profile = solace.SolclientFactoryProfiles.version10;
        (factoryProps as any).logger = new (solace as any).ConsoleLogImpl();

        solace.SolclientFactory.init(factoryProps);
        solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

        solaceRef.current = solace;
        return solace;
    }, []);

    // ──────────────────────────────────────────────
    // responseTopic 구독 — 최초 발송 시 1회만
    // ──────────────────────────────────────────────
    const subscribeToResponseTopic = useCallback((session: any, solace: any) => {
        try {
            // ✅ 메시지 수신 핸들러 등록
            session.on(solace.SessionEventCode.MESSAGE, (message: any) => {
                try {
                    const props = message.getUserPropertyMap();
                    const selectorKey =
                        props?.getField("selectorKey")?.getValue() ?? null;

                    // ✅ TextMessage payload 추출
                    const sdtContainer = message.getSdtContainer();
                    const payload = sdtContainer ? (sdtContainer.getValue() ?? "") : "";

                    const destination = message.getDestination()?.getName() ?? "";

                    console.log(
                        `[Topic 수신] topic: ${destination}, selectorKey: ${selectorKey}`,
                    );

                    // ✅ selectorKey 매칭
                    if (selectorKey && pendingRef.current.has(selectorKey)) {
                        const pending = pendingRef.current.get(selectorKey)!;
                        clearTimeout(pending.timer);
                        pendingRef.current.delete(selectorKey);
                        pending.resolve(payload);

                        setMessages((prev) => [
                            ...prev,
                            {
                                id: crypto.randomUUID(),
                                topic: destination,
                                payload,
                                timestamp: new Date(),
                                direction: "received",
                                selectorKey: selectorKey ?? undefined,
                            },
                        ]);
                    } else {
                        console.log(
                            `[Topic 수신] selectorKey 미매칭 — 무시: ${selectorKey}`,
                        );
                    }
                } catch (e: any) {
                    console.error("[Topic] MESSAGE 처리 오류:", e);
                }
            });

            // ✅ responseTopic 구독
            session.subscribe(
                solace.SolclientFactory.createTopicDestination(
                    SOLACE_CONFIG.responseTopic,
                ),
                true,
                SOLACE_CONFIG.responseTopic,
                10000,
            );

            isSubscribedRef.current = true;
            console.log(`✅ Topic 구독 성공 — ${SOLACE_CONFIG.responseTopic}`);
        } catch (e: any) {
            console.error("❌ Topic 구독 실패:", e);
            setError(`Topic 구독 실패: ${e.message}`);
        }
    }, []);

    // ──────────────────────────────────────────────
    // connect
    // ──────────────────────────────────────────────
    const connect = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);

            const solace = await loadSolace();
            if (!solace) return;

            const session = solace.SolclientFactory.createSession({
                url: SOLACE_CONFIG.host,
                vpnName: SOLACE_CONFIG.vpnName,
                userName: SOLACE_CONFIG.username,
                password: SOLACE_CONFIG.password,
                clientName: SOLACE_CONFIG.clientName,
                connectTimeoutInMsecs: 10000,
                reconnectRetries: 3,
            });

            session.on(solace.SessionEventCode.UP_NOTICE, () => {
                console.log("✅ Solace 연결 성공");
                setIsConnected(true);
                setIsConnecting(false);
            });

            session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (e: any) => {
                console.error("❌ 연결 실패:", e);
                setError(`연결 실패: ${e.message}`);
                setIsConnecting(false);
            });

            session.on(solace.SessionEventCode.DISCONNECTED, () => {
                setIsConnected(false);
                setIsConnecting(false);
                isSubscribedRef.current = false;
            });

            session.on(solace.SessionEventCode.RECONNECTED_NOTICE, () => {
                setIsConnected(true);
            });

            session.connect();
            sessionRef.current = session;
        } catch (e: any) {
            setError(`초기화 실패: ${e.message}`);
            setIsConnecting(false);
        }
    }, [loadSolace]);

    // ──────────────────────────────────────────────
    // publish
    // ──────────────────────────────────────────────
    const publish = useCallback(
        (payload: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                if (!sessionRef.current || !solaceRef.current) {
                    reject("연결되지 않았습니다.");
                    return;
                }

                const solace = solaceRef.current;
                const selectorKey = crypto.randomUUID();

                // ✅ 최초 발송 시 Topic 구독
                if (!isSubscribedRef.current) {
                    subscribeToResponseTopic(sessionRef.current, solace);
                }

                try {
                    const message = solace.SolclientFactory.createMessage();
                    message.setDestination(
                        solace.SolclientFactory.createTopicDestination(TOPICS.REQUEST),
                    );
                    message.setBinaryAttachment(new TextEncoder().encode(payload));
                    message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

                    const payloadObj = JSON.parse(payload);
                    const evetName = payloadObj["head"]["eventNm"];

                    // ✅ SDTMap Property
                    const props = new (solace as any).SDTMapContainer();
                    props.addField("eventName", solace.SDTFieldType.STRING, evetName);
                    props.addField(
                        "responseTopic",
                        solace.SDTFieldType.STRING,
                        SOLACE_CONFIG.responseTopic,
                    );
                    props.addField(
                        "selectorKey",
                        solace.SDTFieldType.STRING,
                        selectorKey,
                    );
                    message.setUserPropertyMap(props);

                    // ✅ 10초 타임아웃
                    const timer = setTimeout(() => {
                        pendingRef.current.delete(selectorKey);
                        setError(`응답 타임아웃 (10초)`);
                        reject("타임아웃");
                    }, 10000);

                    pendingRef.current.set(selectorKey, {resolve, reject, timer});
                    sessionRef.current.send(message);

                    setMessages((prev) => [
                        ...prev,
                        {
                            id: crypto.randomUUID(),
                            topic: TOPICS.REQUEST,
                            payload,
                            timestamp: new Date(),
                            direction: "sent",
                            selectorKey,
                        },
                    ]);
                } catch (e: any) {
                    reject(`발송 실패: ${e.message}`);
                    setError(`발송 실패: ${e.message}`);
                }
            });
        },
        [subscribeToResponseTopic],
    );

    // ──────────────────────────────────────────────
    // disconnect
    // ──────────────────────────────────────────────
    const disconnect = useCallback(() => {
        isSubscribedRef.current = false;

        pendingRef.current.forEach(({reject, timer}) => {
            clearTimeout(timer);
            reject("연결 해제됨");
        });
        pendingRef.current.clear();

        if (sessionRef.current) {
            sessionRef.current.disconnect();
            sessionRef.current = null;
        }
        setIsConnected(false);
        setMessages([]);
    }, []);

    const clearMessages = useCallback(() => setMessages([]), []);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        isConnecting,
        messages,
        error,
        connect,
        publish,
        disconnect,
        clearMessages,
    };
}
