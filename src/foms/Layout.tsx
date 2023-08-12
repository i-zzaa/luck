interface Props {
  children: JSX.Element;
}

export const Layout = ({ children }: Props) => {
  return (
    <main className="h-screen overflow-y-auto">
      <div className="pb-6 px-1 sm:px-8 lg:px-4  my-8 mb-2">
        {children}
      </div>
    </main>
  );
};
