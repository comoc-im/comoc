import {signalerServerBaseUrl} from "@/config";

interface PeerInfo {
    description: RTCSessionDescription;
    candidates: Array<RTCIceCandidate>;
}

export function registerDescription (des: RTCSessionDescription, username: string) {
    return fetch(`${signalerServerBaseUrl}/post/description?username=${username}`,
        {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(des)
        }
    )
}

export function registerCandidate (candidate: RTCIceCandidate, username: string) {
    return fetch(`${signalerServerBaseUrl}/post/candidate?username=${username}`,
        {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(candidate)
        }
    )
}

function readPeerInfo (username: string) {
    return fetch(`${signalerServerBaseUrl}/read?username=${username}`, {
        mode: "cors"
    }).then(res => res.json())
}

export function listenPeerInfo (username: string, func: (pr: PeerInfo) => unknown) {
    setInterval(async function () {
        const result = await readPeerInfo(username) as PeerInfo
        if (result) {
            func(result)
        }
    }, 5000)
}

