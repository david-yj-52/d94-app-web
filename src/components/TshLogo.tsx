"use client";

import Image from "next/image";

export default function TshLogo({
                                    className = "h-8 w-8 object-contain",
                                }: {
    className?: string;
}) {
    return (
        <Image
            src="/tsh-logo.png"
            alt=""
            width={160}
            height={160}
            className={className}
            onError={(e) => {
                e.currentTarget.style.display = "none";
            }}
        />
    );
}
