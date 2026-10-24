"use client";
import { useState, type ImgHTMLAttributes } from "react";
import { homeMobileImage } from "./home-imagery";
const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='600' viewBox='0 0 900 600'%3E%3Crect width='900' height='600' fill='%23f2f5f8'/%3E%3Crect x='165' y='90' width='420' height='420' rx='18' fill='white' stroke='%23123d70' stroke-width='5'/%3E%3Ccircle cx='300' cy='230' r='45' fill='%23ef6958'/%3E%3Cpath d='M430 185l55 95H375z' fill='%23f2bf3e'/%3E%3Cpath d='M240 355h270m-270 55h210' stroke='%23123d70' stroke-width='12'/%3E%3C/svg%3E";
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "onError"> & {src: string; mobile?: string};
export function HomeArtwork({src, mobile, ...props}: Props) {
  return <Artwork key={src + "|" + (mobile || "")} src={src} mobile={mobile} {...props}/>;
}
function Artwork({src, mobile = homeMobileImage(src), ...props}: Props) {
  const [failed, setFailed] = useState(0);
  return <picture style={{display:"contents"}}>
    {mobile !== src && failed === 0 ? <source media="(max-width: 760px)" srcSet={mobile}/> : null}
    <img {...props} src={failed === 2 ? fallback : src} decoding="async" onError={() => setFailed(n => n === 0 && mobile !== src ? 1 : 2)}/>
  </picture>;
}
