interface LoadingOverlayProps {
    loading: boolean;
    text?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
    loading, 
    text = "Processing..." 
}) => {
    if (!loading) return null;

    return (
        <div className="absolute inset-0 bg-gray-900/50 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-white font-medium">{text}</p>
            </div>
        </div>
    );
};

export default LoadingOverlay; 