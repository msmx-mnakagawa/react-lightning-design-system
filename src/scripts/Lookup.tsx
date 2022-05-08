import React, {
  InputHTMLAttributes,
  ChangeEvent,
  KeyboardEvent,
  SyntheticEvent,
  MouseEvent,
  FC,
  Ref,
  useRef,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import classnames from 'classnames';
import { AutoAlign, AutoAlignInjectedProps, AutoAlignProps } from './AutoAlign';
import { Button } from './Button';
import { FormElement, FormElementProps } from './FormElement';
import { Input, InputProps } from './Input';
import { Icon, IconCategory } from './Icon';
import { Spinner } from './Spinner';
import { Pill } from './Pill';
import { DropdownButton } from './DropdownButton';
import { DropdownMenuItem } from './DropdownMenu';
import { isElInChildren, registerStyle } from './util';
import { ComponentSettingsContext } from './ComponentSettings';
import mergeRefs from 'react-merge-refs';
import { useControlledValue, useFormElementId } from './hooks';
import { createFC } from './common';

/**
 *
 */
type Entry = {
  label: string;
  value: string;
  icon?: string;
  scope?: string;
  category?: IconCategory;
  meta?: string;
};

export type LookupEntry = Entry;

export type LookupSelectionProps<LookupEntry extends Entry> = {
  id?: string;
  selected?: LookupEntry;
  hidden?: boolean;
  onResetSelection?: () => void;
  lookupSelectionRef?: Ref<HTMLDivElement>;
};

/**
 *
 */
export const LookupSelection = <LookupEntry extends Entry>(
  props: LookupSelectionProps<LookupEntry>
) => {
  const { id, hidden, selected, lookupSelectionRef, onResetSelection } = props;
  const pillRef = useRef<HTMLElement | null>(null);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.keyCode === 8 || e.keyCode === 46) {
        // Bacspace / DEL
        e.preventDefault();
        e.stopPropagation();
        onResetSelection?.();
      }
    },
    [onResetSelection]
  );

  const onPillClick = useCallback((e: MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.focus();
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const lookupClassNames = classnames({ 'slds-hide': hidden });
  return (
    <div ref={lookupSelectionRef} className={lookupClassNames}>
      <div className='slds-pill_container'>
        {selected ? (
          <Pill
            id={id}
            truncate
            pillRef={pillRef}
            onKeyDown={onKeyDown}
            onClick={onPillClick}
            tabIndex={0}
            icon={
              selected.icon
                ? {
                    category: selected.category,
                    icon: selected.icon,
                  }
                : undefined
            }
            label={selected.label}
            onRemove={onResetSelection}
          />
        ) : undefined}
      </div>
    </div>
  );
};

/**
 *
 */
export type LookupScope = {
  label: string;
  value: string;
  icon: string;
};

/**
 *
 */
export type LookupSearchProps = Omit<
  InputProps,
  'value' | 'defaultValue' | 'onChange' | 'onSelect' | 'onValueChange'
> & {
  hidden?: boolean;
  searchText?: string;
  scopes?: LookupScope[];
  targetScope?: string;
  iconAlign?: 'left' | 'right';
  disabled?: boolean;
  onBlur?: () => void;
  onSearchTextChange?: (searchText: string) => void;
  onScopeMenuClick?: (e: SyntheticEvent<HTMLButtonElement>) => void;
  onScopeSelect?: (value: string) => void;
  onPressDown?: () => void;
  onSubmit?: () => void;
  onComplete?: (cancel?: boolean) => void;
  lookupSearchRef?: Ref<HTMLDivElement>;
};

/**
 *
 */
function useInitLookupSearchComponent() {
  useEffect(() => {
    registerStyle('lookup-search', [
      [
        '.react-slds-lookup.slds-lookup[data-scope="multi"] .react-slds-lookup-scope-selector',
        '{ min-width: 3rem; }',
      ],
      [
        '.react-slds-lookup.slds-lookup[data-scope="multi"] .react-slds-lookup-scope-selector .slds-dropdown-trigger',
        '{ margin-left: 0; }',
      ],
      [
        '.react-slds-lookup.slds-lookup[data-scope="multi"] .react-slds-lookup-scope-selector .slds-dropdown-trigger .slds-button',
        '{ padding: 0 0.25rem; }',
      ],
      [
        '.react-slds-lookup.slds-lookup[data-scope="multi"] .slds-box_border',
        '{ background-color: white; }',
      ],
      [
        '.react-slds-lookup.slds-lookup[data-scope="multi"] .slds-box_border.react-slds-box-disabled',
        '{ background-color: #e0e5ee; border-color: #a8b7c7; cursor: not-allowed; }',
      ],
      [
        '.react-slds-lookup.slds-lookup[data-scope="multi"] .slds-box_border .slds-input_bare',
        '{ height: 2.15rem; width: 100%; }',
      ],
    ]);
  }, []);
}

/**
 *
 */
export const LookupSearch: FC<LookupSearchProps> = (props_) => {
  const {
    className,
    hidden,
    searchText,
    iconAlign = 'right',
    scopes,
    targetScope,
    disabled,
    lookupSearchRef,
    onSearchTextChange,
    onScopeMenuClick,
    onScopeSelect,
    onKeyDown,
    onPressDown,
    onBlur,
    onComplete,
    onSubmit,
    ...rprops
  } = props_;

  useInitLookupSearchComponent();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const elRef = useRef<HTMLDivElement | null>(null);

  const onLookupIconClick = useCallback(() => {
    inputRef.current?.focus();
    onSubmit?.();
  }, [onSubmit]);

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      // return key
      e.preventDefault();
      e.stopPropagation();
      const searchText = e.currentTarget.value;
      if (searchText) {
        onSubmit?.();
      } else {
        // if no search text, quit lookup search
        onComplete?.();
      }
    } else if (e.keyCode === 40) {
      // down key
      e.preventDefault();
      e.stopPropagation();
      onPressDown?.();
    } else if (e.keyCode === 27) {
      // ESC
      e.preventDefault();
      e.stopPropagation();
      // quit lookup search (cancel)
      const cancel = true;
      onComplete?.(cancel);
    }
    onKeyDown?.(e);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchText = e.target.value;
    onSearchTextChange?.(searchText);
  };

  const onInputBlur = () => {
    setTimeout(() => {
      if (!isFocusedInComponent()) {
        onBlur?.();
      }
    }, 10);
  };

  const elementRef = lookupSearchRef
    ? mergeRefs([elRef, lookupSearchRef])
    : elRef;

  const { getActiveElement } = useContext(ComponentSettingsContext);

  const isFocusedInComponent = () => {
    const targetEl = getActiveElement();
    return isElInChildren(elRef.current, targetEl);
  };

  const searchInputClassNames = classnames(
    'slds-grid',
    'slds-input-has-icon',
    `slds-input-has-icon_${iconAlign}`,
    { 'slds-hide': hidden },
    className
  );
  const searchInput = (
    <div
      ref={scopes != null ? undefined : elementRef}
      className={searchInputClassNames}
    >
      <Input
        {...rprops}
        className={scopes != null ? 'slds-col' : undefined}
        bare={scopes != null}
        inputRef={inputRef}
        value={searchText}
        onKeyDown={onInputKeyDown}
        onChange={onInputChange}
        onBlur={onInputBlur}
      />
      <Button
        type='icon'
        icon='search'
        disabled={disabled}
        className='slds-input__icon slds-input__icon_right'
        tabIndex={-1}
        onClick={disabled ? undefined : onLookupIconClick}
        onBlur={onInputBlur}
      />
    </div>
  );

  if (scopes) {
    let target = scopes[0] || {};
    for (const scope of scopes) {
      if (scope.value === targetScope) {
        target = scope;
        break;
      }
    }
    const icon = <Icon icon={target.icon || 'none'} size='x-small' />;
    const selectorClassNames = classnames(
      'slds-grid',
      'slds-grid_align-center',
      'slds-grid_vertical-align-center',
      'react-slds-lookup-scope-selector'
    );
    const lookupSearchClassNames = classnames(
      'slds-grid',
      'slds-form-element__control',
      'slds-box_border',
      { 'react-slds-box-disabled': disabled },
      { 'slds-hide': hidden }
    );
    const styles = {
      WebkitFlexWrap: 'nowrap' as const,
      msFlexWrap: 'nowrap',
      flexWrap: 'nowrap' as const,
    };
    return (
      <div ref={elementRef} className={lookupSearchClassNames} style={styles}>
        <div className={selectorClassNames}>
          <DropdownButton
            label={icon}
            disabled={disabled}
            onClick={onScopeMenuClick}
            onMenuSelect={(v: string | number) =>
              onScopeSelect && onScopeSelect(String(v))
            }
            onBlur={onInputBlur}
          >
            {scopes.map((scope: LookupScope) => (
              <DropdownMenuItem
                key={scope.value}
                eventKey={scope.value}
                label={scope.label}
                icon={scope.icon}
              />
            ))}
          </DropdownButton>
        </div>
        {searchInput}
      </div>
    );
  }
  return searchInput;
};

/**
 *
 */
type LookupCandidateListProps<LookupEntry extends Entry> = {
  data?: LookupEntry[];
  focus?: boolean;
  loading?: boolean;
  filter?: (entry: LookupEntry) => boolean;
  listRef?: Ref<HTMLDivElement>;
  onSelect?: (entry: LookupEntry | null) => void;
  onBlur?: (e: React.FocusEvent<HTMLAnchorElement>) => void;
  header?: JSX.Element;
  footer?: JSX.Element;
};

function trueFilter() {
  return true;
}

/**
 *
 */
const LookupCandidateListInner = <LookupEntry extends Entry>(
  props_: LookupCandidateListProps<LookupEntry> & AutoAlignInjectedProps
) => {
  const {
    data = [],
    loading,
    header,
    footer,
    filter = trueFilter,
    alignment,
    listRef,
    focus,
    onSelect: onSelect_,
    onBlur,
  } = props_;

  const elRef = useRef<HTMLDivElement | null>(null);

  const elementRef = useMemo(
    () => (listRef ? mergeRefs([elRef, listRef]) : elRef),
    [listRef]
  );

  const focusToTargetItemEl = useCallback((index: number) => {
    const el = elRef.current;
    if (!el) {
      return;
    }
    const anchors = el.querySelectorAll<HTMLAnchorElement>(
      '.react-slds-candidate[tabIndex]'
    );
    if (anchors[index]) {
      anchors[index].focus();
    }
  }, []);

  useEffect(() => {
    if (focus) {
      setTimeout(() => {
        focusToTargetItemEl(0);
      }, 10);
    }
  }, [focus, focusToTargetItemEl]);

  const onSelect = useCallback(
    (entry: LookupEntry | null) => {
      onSelect_?.(entry);
    },
    [onSelect_]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.keyCode === 38 || e.keyCode === 40) {
        // UP/DOWN
        e.preventDefault();
        e.stopPropagation();
        const currentEl = (e.target as HTMLElement).parentElement;
        let itemEl: Element | null = currentEl
          ? e.keyCode === 40
            ? currentEl.nextElementSibling
            : currentEl.previousElementSibling
          : null;
        while (itemEl) {
          const anchorEl = itemEl.querySelector<HTMLAnchorElement>(
            '.react-slds-candidate[tabIndex]'
          );
          if (anchorEl && !anchorEl.ariaDisabled) {
            anchorEl.focus();
            return;
          }
          itemEl =
            e.keyCode === 40
              ? itemEl.nextElementSibling
              : itemEl.previousElementSibling;
        }
      } else if (e.keyCode === 27) {
        // ESC
        e.preventDefault();
        e.stopPropagation();
        onSelect(null);
      }
    },
    [onSelect]
  );

  const lookupMenuClassNames = classnames('slds-lookup__menu', 'slds-show');
  const [vertAlign, align] = alignment;
  const listStyles = {
    minWidth: '15rem',
    ...(vertAlign === 'bottom' ? { bottom: '100%' } : {}),
    ...(align === 'right' ? { left: 'auto', right: 0 } : {}),
  };
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      ref={elementRef}
      className={lookupMenuClassNames}
      style={listStyles}
      role='listbox'
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {header ? <div className='slds-lookup__item'>{header}</div> : undefined}
      <ul className='slds-lookup__list' role='presentation'>
        {data.filter(filter).map((entry) => {
          const { category, icon, label, value, meta } = entry;
          return (
            <li key={value} role='presentation'>
              <a
                className='slds-lookup__item-action react-slds-candidate'
                tabIndex={-1}
                role='option'
                aria-selected={false}
                onKeyDown={(e) => e.keyCode === 13 && onSelect(entry)}
                onBlur={onBlur}
                onClick={() => onSelect(entry)}
              >
                <span
                  className='slds-truncate'
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  {icon ? (
                    <Icon
                      style={{ minWidth: '1.5rem' }}
                      className='slds-m-right_x-small'
                      category={category}
                      icon={icon}
                      size='small'
                    />
                  ) : undefined}
                  <div className='slds-truncate'>
                    <span className='slds-lookup__result-text slds-truncate'>
                      {label}
                    </span>
                    {meta ? (
                      <span className='slds-lookup__result-meta slds-truncate'>
                        {meta}
                      </span>
                    ) : undefined}
                  </div>
                </span>
              </a>
            </li>
          );
        })}
        {loading ? (
          <li
            className='slds-lookup__item'
            key='loading'
            style={{ height: 20 }}
          >
            <Spinner
              container={false}
              size='small'
              style={{ margin: '0 auto' }}
            />
          </li>
        ) : undefined}
      </ul>
      {footer ? <div className='slds-lookup__item'>{footer}</div> : undefined}
    </div>
  );
};

/**
 *
 */
const LookupCandidateList = <LookupEntry extends Entry>({
  align,
  portalClassName,
  portalStyle,
  ...props
}: LookupCandidateListProps<LookupEntry> &
  Pick<AutoAlignProps, 'align' | 'portalClassName' | 'portalStyle'>) => (
  <AutoAlign
    triggerSelector='.slds-lookup'
    alignmentStyle='menu'
    align={align}
    portalClassName={portalClassName}
    portalStyle={portalStyle}
  >
    {(injectedProps) => (
      <LookupCandidateListInner {...props} {...injectedProps} />
    )}
  </AutoAlign>
);

/**
 *
 */
export type LookupProps<
  LookupEntry extends Entry,
  SelectedEntry extends LookupEntry
> = {
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: FormElementProps['error'];
  iconAlign?: 'left' | 'right';

  value?: string | null;
  defaultValue?: string | null;

  selected?: SelectedEntry | null;
  defaultSelected?: SelectedEntry | null;

  opened?: boolean;
  defaultOpened?: boolean;

  searchText?: string;
  defaultSearchText?: string;

  loading?: boolean;
  data?: LookupEntry[];
  lookupFilter?: (
    entry: LookupEntry,
    searchText?: string,
    targetScope?: string
  ) => boolean;
  listHeader?: JSX.Element;
  listFooter?: JSX.Element;
  scopes?: LookupScope[];
  targetScope?: string;
  defaultTargetScope?: string;
  cols?: number;

  elementRef?: Ref<HTMLDivElement>;
  candidateListRef?: Ref<HTMLDivElement>;
  selectionRef: Ref<HTMLDivElement>;

  onSearchTextChange?: (searchText: string) => void;
  onScopeMenuClick?: (e: SyntheticEvent<HTMLButtonElement>) => void;
  onScopeSelect?: (targetScope: string) => void;
  onLookupRequest?: (searchText: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onSelect?: (entry: LookupEntry | null) => void;
  onComplete?: (cancel?: boolean) => void;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'onBlur' | 'onFocus' | 'onSelect'
>;

/**
 *
 */
export const Lookup = createFC(
  <LookupEntry extends Entry, SelectedEntry extends LookupEntry>(
    props: LookupProps<LookupEntry, SelectedEntry>
  ) => {
    const {
      id: id_,
      selected: selected_,
      defaultSelected,
      opened: opened_,
      defaultOpened,
      searchText: searchText_,
      defaultSearchText,
      targetScope: targetScope_,
      defaultTargetScope,
      cols,
      label,
      required,
      error,
      className,
      loading,
      lookupFilter,
      listHeader,
      listFooter,
      data,
      scopes,
      onSelect: onSelect_,
      onScopeMenuClick: onScopeMenuClick_,
      onScopeSelect: onScopeSelect_,
      onSearchTextChange: onSearchTextChange_,
      onLookupRequest: onLookupRequest_,
      onBlur: onBlur_,
      onComplete,
      elementRef,
      selectionRef: selectionRef_,
      candidateListRef: candidateListRef_,
      ...searchProps
    } = props;

    const id = useFormElementId(id_, 'lookup');
    const [selected, setSelected] = useControlledValue<LookupEntry | null>(
      selected_,
      defaultSelected ?? null
    );
    const [opened, setOpened] = useControlledValue(
      opened_,
      defaultOpened ?? false
    );
    const [searchText, setSearchText] = useControlledValue(
      searchText_,
      defaultSearchText ?? ''
    );
    const [targetScope, setTargetScope] = useControlledValue(
      targetScope_,
      defaultTargetScope ?? ''
    );
    const [focusFirstCandidate, setFocusFirstCandidate] = useState(false);

    const elRef = useRef<HTMLDivElement | null>(null);
    const elRefMerged = useMemo(
      () => (elementRef ? mergeRefs([elRef, elementRef]) : elRef),
      [elementRef]
    );
    const selectionRef = useRef<HTMLDivElement | null>(null);
    const selectionRefMerged = useMemo(
      () =>
        selectionRef_ ? mergeRefs([selectionRef, selectionRef_]) : selectionRef,
      [selectionRef_]
    );
    const candidateListRef = useRef<HTMLDivElement | null>(null);
    const candidateListRefMerged = useMemo(
      () =>
        candidateListRef_
          ? mergeRefs([candidateListRef, candidateListRef_])
          : candidateListRef,
      [candidateListRef_]
    );

    const searchRef = useRef<HTMLDivElement | null>(null);

    const onScopeMenuClick = useCallback(
      (e: SyntheticEvent<HTMLButtonElement>) => {
        setOpened(false);
        onScopeMenuClick_?.(e);
      },
      [setOpened, onScopeMenuClick_]
    );

    const onScopeSelect = useCallback(
      (targetScope: string) => {
        setTargetScope(targetScope);
        onScopeSelect_?.(targetScope);
      },
      [onScopeSelect_, setTargetScope]
    );

    const onSearchTextChange = useCallback(
      (searchText: string) => {
        setSearchText(searchText);
        onSearchTextChange_?.(searchText);
      },
      [onSearchTextChange_, setSearchText]
    );

    const onLookupRequest = useCallback(
      (searchText: string) => {
        setOpened(true);
        onLookupRequest_?.(searchText);
      },
      [onLookupRequest_, setOpened]
    );

    const onResetSelection = useCallback(() => {
      setSelected(null);
      onSelect_?.(null);
      onSearchTextChange('');
      onLookupRequest('');
      setTimeout(() => {
        const searchEl = searchRef.current;
        const inputEl = searchEl && searchEl.querySelector('input');
        inputEl?.focus();
      }, 10);
    }, [onLookupRequest, onSearchTextChange, onSelect_, setSelected]);

    const onLookupItemSelect = useCallback(
      (selected: LookupEntry | null) => {
        if (selected) {
          setSelected(selected);
          setOpened(false);
          onSelect_?.(selected);
          setTimeout(() => {
            const pillElem = selectionRef.current?.querySelector('a');
            pillElem?.focus();
          }, 10);
        } else {
          setOpened(false);
          setTimeout(() => {
            const inputEl = searchRef.current?.querySelector('input');
            inputEl?.focus();
          }, 10);
        }
        onComplete?.();
      },
      [onComplete, onSelect_, setOpened, setSelected]
    );

    const onFocusFirstCandidate = useCallback(() => {
      if (!opened) {
        onLookupRequest(searchText);
      } else {
        setFocusFirstCandidate(true);
        setTimeout(() => {
          setFocusFirstCandidate(false);
        }, 10);
      }
    }, [onLookupRequest, opened, searchText]);

    const { getActiveElement } = useContext(ComponentSettingsContext);
    const isFocusedInComponent = useCallback(() => {
      const targetEl = getActiveElement();
      return (
        isElInChildren(elRef.current, targetEl) ||
        isElInChildren(candidateListRef.current, targetEl)
      );
    }, [getActiveElement]);

    const onBlur = useCallback(() => {
      setTimeout(() => {
        if (!isFocusedInComponent()) {
          setOpened(false);
          onBlur_?.();
          onComplete?.(true); // quit lookup (cancel)
        }
      }, 500);
    }, [isFocusedInComponent, onBlur_, onComplete, setOpened]);

    const lookupClassNames = classnames(
      'slds-lookup',
      'react-slds-lookup',
      { 'slds-has-selection': selected },
      className
    );
    const formElemProps = { id, cols, label, required, error };
    return (
      <FormElement {...formElemProps}>
        <div
          className={lookupClassNames}
          ref={elRefMerged}
          data-select='single'
          data-scope={scopes ? 'multi' : 'single'}
          data-typeahead={false}
        >
          {selected ? (
            <LookupSelection
              id={id}
              lookupSelectionRef={selectionRefMerged}
              selected={selected}
              onResetSelection={onResetSelection}
            />
          ) : (
            <LookupSearch
              {...searchProps}
              id={id}
              lookupSearchRef={searchRef}
              searchText={searchText}
              targetScope={targetScope}
              onScopeMenuClick={onScopeMenuClick}
              onScopeSelect={onScopeSelect}
              onSearchTextChange={onSearchTextChange}
              onSubmit={() => onLookupRequest(searchText || '')}
              onPressDown={onFocusFirstCandidate.bind(this)}
              onComplete={onComplete}
              onBlur={onBlur}
            />
          )}
          {opened ? (
            <LookupCandidateList
              portalClassName={lookupClassNames}
              listRef={candidateListRefMerged}
              data={data}
              focus={focusFirstCandidate}
              loading={loading}
              filter={
                lookupFilter
                  ? (entry: LookupEntry) =>
                      lookupFilter(entry, searchText, targetScope)
                  : undefined
              }
              header={listHeader}
              footer={listFooter}
              onSelect={onLookupItemSelect}
              onBlur={onBlur}
            />
          ) : undefined}
        </div>
      </FormElement>
    );
  },
  { isFormElement: true }
);
