import * as React from "react";
import Image from "next/image";

interface AnveshanaIconProps {
    size?: number;
    className?: string;
}

const AnveshanaIcon = ({size = 30, className}: AnveshanaIconProps) => (
    <Image
        src="/anveshana.png"
        alt="Anveshana Logo"
        width={size}
        height={size}
        className={className}
    />
);
export default AnveshanaIcon;
