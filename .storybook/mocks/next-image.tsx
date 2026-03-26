import React from "react";

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Image = ({ src, alt, width, height, priority: _priority, ...props }: ImageProps) => (
  <img src={src} alt={alt} width={width} height={height} {...props} />
);

export default Image;
