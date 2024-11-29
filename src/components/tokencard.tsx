import Image from "next/image";

export interface TokenInfoProps {
    image: string;
    symbol: string;
    amount: number;
    address: string;
    onSelect?: (address: string, isSelected: boolean) => void;
    isSelected?: boolean;
}

const TokenCard: React.FC<TokenInfoProps> = ({
    address,
    image,
    symbol,
    amount,
    onSelect,
    isSelected = false
}) => {
    return (
        <div
            className={`flex flex-col gap-4 items-center justify-center flex-wrap p-4 rounded-lg cursor-pointer transition-all select-none
                ${isSelected
                    ? 'bg-emerald-50/10'
                    : 'hover:bg-gray-50/5'}`}
            onClick={() => onSelect?.(address, !isSelected)}
            role="checkbox"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(address, !isSelected);
                }
            }}
        >
            <div className="relative pointer-events-none">
                <Image
                    className={`rounded-full transition-all duration-200 ${
                        isSelected ? '' : 'grayscale opacity-70'
                    }`}
                    src={image}
                    alt="tokenimage"
                    width={120}
                    height={120}
                    unoptimized
                    draggable="false"
                />
                {isSelected && (
                    <div className="absolute top-0 right-0 bg-emerald-500 rounded-full p-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                )}
            </div>
            <a
                href={`https://solscan.io/token/${address}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="select-none"
            >
                <p className={`text-sm font-bold transition-colors duration-200 ${
                    isSelected ? 'text-emerald-500' : 'text-gray-400'
                }`}>
                    {amount} ${symbol}
                </p>
            </a>
        </div>
    );
};

export default TokenCard;


export interface TokenInfoProps {
    image: string;
    symbol: string;
    amount: number;
    address: string;
}