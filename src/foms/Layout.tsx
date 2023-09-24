interface Props {
  children: JSX.Element;
}

export const Layout = ({ children }: Props) => {
  return (
    <div className="h-screen overflow-y-auto">
      <div className=" my-4">
        {children}
      </div>
    </div>
  );
};
