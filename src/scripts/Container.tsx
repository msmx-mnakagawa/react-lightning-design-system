import React, { HTMLAttributes } from 'react';
import classnames from 'classnames';

export type ContainerProps = {
  className: string;
  size: 'small' | 'medium' | 'large';
  align: 'left' | 'center' | 'right';
};

export const Container: React.FC<
  ContainerProps & HTMLAttributes<HTMLDivElement>
> = ({ className, size, align, children, ...props }) => {
  const ctClassNames = classnames(
    className,
    `slds-container--${size || 'fluid'}`,
    align ? `slds-container--${align}` : null
  );
  return (
    <div className={ctClassNames} {...props}>
      {children}
    </div>
  );
};
