# React 19 Compatibility Warning

## Issue
There was a console warning about `@radix-ui/react-slot` accessing `element.ref` which was removed in React 19. This is a known issue with Radix UI and React 19 compatibility.

## Status
- **Impact**: Fixed via patch
- **Package**: `@radix-ui/react-slot@1.2.4`
- **Error**: "Accessing element.ref was removed in React 19. ref is now a regular prop."
- **Fix Applied**: Patch created in `patches/@radix-ui__react-slot@1.2.4.patch`

## Solution
A patch has been applied that modifies the `getElementRef` function to only access `element.props.ref` instead of `element.ref`. This is compatible with both React 18 and React 19.

The patch is automatically applied when you run `pnpm install`.

## Future Fix
When Radix UI releases an official React 19 compatible version, you can remove the patch and update:
```bash
# Remove the patch
rm patches/@radix-ui__react-slot@1.2.4.patch

# Update the package
pnpm update @radix-ui/react-slot@latest
```


