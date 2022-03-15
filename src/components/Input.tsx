import { useRef } from 'react';

const Input = (props) => {
  const {
    id,
    leftIcon,
    wrapperClassName = '',
    placeholder = '',
    type = 'text',
    error = false,
    errorText = '',
    ...rest
  } = props;

  const inputRef = useRef();

  const inputClassName = `input input-bordered w-full bg-gradient-to-br  ${
    error
      ? 'input-error'
      : 'focus:outline-none focus:ring focus:ring-violet-300'
  }`;
  return (
    <div className={wrapperClassName}>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          className={inputClassName}
          id={id}
          placeholder={placeholder}
          {...rest}
        />
        {leftIcon ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            {leftIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <label className="label">
          <span className="label-text-alt text-xs text-left  text-red-600">
            {errorText}
          </span>
        </label>
      ) : null}
    </div>
  );
};

export default Input;
