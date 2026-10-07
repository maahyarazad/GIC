import React, { useEffect, useState } from "react";
import Loader from "@/Components/Loader/Loader";
import { getMyEventQr } from "@/api/myEvents";

type QrState =
    | { status: "loading" }
    | { status: "ready"; url: string }
    | { status: "missing" }
    | { status: "error" };

const MyEventQr: React.FC<{ reference: string }> = ({ reference }) => {
    const [state, setState] = useState<QrState>({ status: "loading" });

    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;

        getMyEventQr(reference)
            .then((blob) => {
                if (cancelled) return;
                if (!blob) {
                    setState({ status: "missing" });
                    return;
                }
                objectUrl = URL.createObjectURL(blob);
                setState({ status: "ready", url: objectUrl });
            })
            .catch((err) => {
                console.error("Failed to load QR code", err);
                if (!cancelled) setState({ status: "error" });
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [reference]);

    return (
        <div className="my-event-qr text-center">
            {state.status === "loading" && <Loader />}
            {state.status === "missing" && <p className="mb-0">QR code not available yet.</p>}
            {state.status === "error" && <p className="mb-0">Could not load the QR code.</p>}
            {state.status === "ready" && (
                <>
                    <img src={state.url} alt={`QR code for ${reference}`} />
                    <p className="my-event-qr__reference">{reference}</p>
                    <a className="dashboard-btn my-event-qr__download" href={state.url} download={`${reference}.png`}>
                        Download
                    </a>
                </>
            )}
        </div>
    );
};

export default MyEventQr;
