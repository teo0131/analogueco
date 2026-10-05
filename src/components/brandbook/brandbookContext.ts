import { createContext, useContext } from "react";

export const BrandbookDisplayContext = createContext<{ hideNumbers?: boolean }>({});
export const useBrandbookDisplay = () => useContext(BrandbookDisplayContext);