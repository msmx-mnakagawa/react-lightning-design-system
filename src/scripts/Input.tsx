import React, {
  ReactElement,
  InputHTMLAttributes,
  KeyboardEvent,
  ChangeEvent,
  useEffect,
  useContext,
  Ref,
  useRef,
} from 'react';
import classnames from 'classnames';
import keycoder from 'keycoder';
import { Icon } from './Icon';
import { FormElement, FormElementProps } from './FormElement';
import { Text } from './Text';
import { FieldSetColumnContext } from './FieldSet';
import { registerStyle } from './util';
import { useEventCallback, useFormElementId } from './hooks';
import { createFC } from './common';

/**
 *
 */
function useInitComponentStyle() {
  useEffect(() => {
    registerStyle('input-icons', [
      // fix styles of double-iconed input
      [
        '.slds-input-has-icon_left-right .react-slds-icon.slds-input__icon_right',
        '{ left: auto; }',
      ],
    ]);
  }, []);
}

/**
 *
 */
const InputAddon = ({ content }: { content: string }) => (
  <Text
    tag='span'
    className='slds-form-element__addon'
    category='body'
    type='regular'
  >
    {content}
  </Text>
);

/**
 *
 */
const InputIcon = ({
  icon,
  align,
}: {
  icon: string | ReactElement;
  align: 'left' | 'right';
}) => {
  return React.isValidElement(icon) ? (
    icon
  ) : typeof icon === 'string' ? (
    <Icon
      icon={icon}
      className={classnames(
        'slds-input__icon',
        `slds-input__icon_${align}`,
        'slds-icon-text-default'
      )}
    />
  ) : (
    <></>
  );
};

/**
 *
 */
export type InputProps = {
  label?: string;
  required?: boolean;
  error?: FormElementProps['error'];
  cols?: number;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  bare?: boolean;
  symbolPattern?: string;
  readOnly?: boolean;
  htmlReadOnly?: boolean;
  iconLeft?: string | JSX.Element;
  iconRight?: string | JSX.Element;
  addonLeft?: string;
  addonRight?: string;
  elementRef?: Ref<HTMLDivElement>;
  inputRef?: Ref<HTMLInputElement>;
  onValueChange?: (value: string, prevValue?: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'>;

/**
 *
 */
export const Input = createFC<InputProps, { isFormElement: boolean }>(
  (props) => {
    const {
      id: id_,
      className,
      label,
      required,
      error,
      readOnly,
      cols,
      type,
      bare,
      value,
      defaultValue,
      htmlReadOnly,
      iconLeft,
      iconRight,
      addonLeft,
      addonRight,
      symbolPattern,
      elementRef,
      inputRef,
      onKeyDown: onKeyDown_,
      onChange: onChange_,
      onValueChange,
      ...rprops
    } = props;

    useInitComponentStyle();

    const prevValueRef = useRef<string>();

    const onKeyDown = useEventCallback((e: KeyboardEvent<HTMLInputElement>) => {
      if (symbolPattern) {
        const { keyCode, shiftKey } = e;
        const value = keycoder.toCharacter(keyCode, shiftKey);
        if (value && !value.match(new RegExp(symbolPattern))) {
          e.preventDefault();
          return;
        }
      }
      onKeyDown_?.(e);
    });

    const onChange = useEventCallback((e: ChangeEvent<HTMLInputElement>) => {
      onChange_?.(e);
      onValueChange?.(e.target.value, prevValueRef.current);
      prevValueRef.current = e.target.value;
    });

    const id = useFormElementId(id_, 'input');
    const { isFieldSetColumn } = useContext(FieldSetColumnContext);
    const inputClassNames = classnames(
      className,
      bare ? 'slds-input_bare' : 'slds-input'
    );
    const inputElem = readOnly ? (
      <Text
        id={id}
        type='regular'
        category='body'
        className='slds-form-element__static'
      >
        {value}
      </Text>
    ) : (
      <input
        ref={inputRef}
        className={inputClassNames}
        id={id}
        type={type}
        value={value}
        defaultValue={defaultValue}
        readOnly={htmlReadOnly}
        {...rprops}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    );

    let contentElem = inputElem;
    if (iconLeft || iconRight || addonLeft || addonRight) {
      const wrapperClassName = classnames(
        'slds-form-element__control',
        { 'slds-input-has-icon': iconLeft || iconRight },
        { 'slds-input-has-icon_left-right': iconLeft && iconRight },
        { 'slds-input-has-icon_left': iconLeft },
        { 'slds-input-has-icon_right': iconRight },
        { 'slds-input-has-fixed-addon': addonLeft || addonRight }
      );
      contentElem = (
        <div className={wrapperClassName}>
          {addonLeft ? <InputAddon content={addonLeft} /> : undefined}
          {iconLeft ? <InputIcon icon={iconLeft} align='left' /> : undefined}
          {inputElem}
          {iconRight ? <InputIcon icon={iconRight} align='right' /> : undefined}
          {addonRight ? <InputAddon content={addonRight} /> : undefined}
        </div>
      );
    }
    if (isFieldSetColumn || label || required || error || cols) {
      const formElemProps = {
        id,
        label,
        required,
        error,
        readOnly,
        cols,
        elementRef,
      };
      return <FormElement {...formElemProps}>{contentElem}</FormElement>;
    }
    return contentElem;
  },
  { isFormElement: true }
);
