import { createContext, useContext } from "react";

export const OverviewVisibleContext = createContext(true);
export const useOverviewVisible = () => useContext(OverviewVisibleContext);
