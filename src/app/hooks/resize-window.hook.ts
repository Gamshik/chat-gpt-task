import { useCallback, useEffect, useState } from "react";

//#region const/interfaces

const MAX_MOBILE_WIDTH = 768;

interface ISize {
  width: number;
  height: number;
}

interface IResizeWindowHookResult {
  isMobile: boolean;
  windowSize: ISize;
}

//#endregion

//#region functions

const getWindowSize = (): ISize => {
  if (typeof window === "undefined") return { width: 0, height: 0 };

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

//#endregion

// TODO(для практики): переделать логику: один глобальный listener(singleton) и много подписчиков
export const useResizeWindow = (): IResizeWindowHookResult => {
  const [windowSize, setWindowSize] = useState<ISize>(getWindowSize);

  const handleResize = useCallback(() => {
    setWindowSize(getWindowSize());
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return {
    isMobile: windowSize.width <= MAX_MOBILE_WIDTH,
    windowSize,
  };
};
