/**
 * A component that renders one (or none) of its child components. Specify the property to check on
 * the Switch component. E.g. if you wanted to run the switch on a prop named "route":
 *
 * <Switch route="value1">
 *  <Item1 prop="value1"/>
 *  <Item2 prop="value2"/>
 *  <Item2 prop="value3"/>
 * </Switch>
 *
 * Item1 would be returned.
 */
export default function Switch({ children, ...props }) {
  const propName = Object.keys(props)[0];
  const targetValue = props[propName];
  const match = children.find(child => child.props[propName] === targetValue);
  return match !== undefined ? match : null;
}
