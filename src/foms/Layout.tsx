import React from "react";
interface Props {
  children: JSX.Element;
}

export const Layout = ({ children }: Props) => {
  return (
    <main className="h-screen overflow-y-auto bg-white">
      <div className="mx-auto py-6 px-8 lg:px-12 container my-8  mb-2">
        <div className=" py-6">{children}</div>
      </div>
    </main>
  );
};
