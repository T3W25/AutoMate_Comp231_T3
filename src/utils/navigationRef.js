// src/utils/navigationRef.js
import { createRef } from 'react';

/**
 * Used to navigate outside of components
 * For example, in error handler or services
 */
export const navigationRef = createRef();

export function navigate(name, params) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  }
}

export function reset(index, routes) {
  if (navigationRef.current) {
    navigationRef.current.reset({
      index,
      routes,
    });
  }
}