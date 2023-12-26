interface Props {
  children: JSX.Element;
}

export const Layout = ({ children }: Props) => {
  return (
    <div className="h-screen overflow-y-auto">
      <div className="mx-2 mt-4 mb-16">
        {children}
      </div>
    </div>
  );
};
