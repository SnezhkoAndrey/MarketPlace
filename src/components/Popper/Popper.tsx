import { useEffect, useRef } from "react";
import "./Popper.scss";

type PropsType = {
  open: boolean;
  children: React.ReactNode;
  onClickOutside: () => void;
};

const Popper = ({ open, children, onClickOutside }: PropsType) => {
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutsideContent = (e: MouseEvent) => {
      if (
        selectRef?.current &&
        open &&
        !selectRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        e.stopPropagation();
        onClickOutside();
      }
    };
    window.addEventListener("click", clickOutsideContent, true);

    return () => {
      window.removeEventListener("click", clickOutsideContent);
    };
  }, [selectRef]);

  return (
    <div className={`menu ${open ? "open" : ""}`} ref={selectRef}>
      {children}
    </div>
  );
};
export default Popper;
