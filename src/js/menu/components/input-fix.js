import { h } from "preact";

/**
 * The order of attribute handling in preact is buggy. E.g. it doesn't set min/max/step on a slider
 * before setting the value. This is problematic, especially for the initial render. This input
 * ensures that the value is the last prop.
 */
export default function InputFix(props) {
  const { value, ...otherProps } = props;
  return <input {...otherProps} value={value} />;
}
