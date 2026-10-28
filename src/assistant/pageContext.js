import { useEffect } from 'react';

let current = null;

export function getPageContext() {
  return current;
}

// أي صفحة بتستدعي هاد الـ hook بتبعت بياناتها للمساعد
export function usePageContext(data) {
  const json = data == null ? null : JSON.stringify(data);
  useEffect(() => {
    current = json;
    return () => {
      if (current === json) current = null;
    };
  }, [json]);
}