import * as React from "react";
import {IconProps} from "@/types";

const AnveshanaIcon = ({size = 30, ...props}: IconProps) => (
    <svg
        height={size}
        width={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="none"/>
        <path
            d="M50 15 L65 55 L75 85 L50 70 L25 85 L35 55 Z"
            fill="currentColor"
            opacity="0.9"
        />
        <circle cx="50" cy="42" r="8" fill="currentColor" opacity="0.7"/>
    </svg>
);
export default AnveshanaIcon;
