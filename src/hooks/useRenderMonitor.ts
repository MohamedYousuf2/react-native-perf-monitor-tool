import { useEffect, useRef } from 'react';
import { performanceStore } from '../store/performanceStore';

export function useRenderMonitor(componentName: string, props?: Record<string, unknown>): void {
  const prevPropsRef = useRef<Record<string, unknown> | undefined>(undefined);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const reasons: string[] = [];

    if (isFirstRender.current) {
      reasons.push('mount');
      isFirstRender.current = false;
    } else {
      if (props && prevPropsRef.current) {
        Object.keys(props).forEach((key) => {
          if (props[key] !== prevPropsRef.current![key]) {
            reasons.push(`props.${key} changed`);
          }
        });
      }

      if (reasons.length === 0) {
        reasons.push('state changed');
      }
    }

    if (props) {
      prevPropsRef.current = { ...props };
    }

    performanceStore.recordRender(componentName, reasons);
  });
}