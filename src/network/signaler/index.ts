export enum SignalingMessageType {
    Description = "description",
    Candidate = "candidate",
    Heartbeat = "heartbeat"
}

export type SignalingMessage = {
    from: string;
    to: string;
    type: SignalingMessageType;
    payload: string;
}

export interface Signaler {
    send (data: SignalingMessage): void;

    onMessage (func: (msg: SignalingMessage) => unknown): void;
}
