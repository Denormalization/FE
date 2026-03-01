export interface EyeTrackProps {
    onGazeUpdate?: (elementId: string | null) => void;
}

declare global {
    interface Window {
        webgazer: any;
    }
}