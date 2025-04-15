import logoLg from '../../assets/logo-lg.jpg';
import { Title } from '../title';

interface Props {
  heading: string;
}

export default function Header({ heading }: Props) {
  return (
    <div className="mb-10 text-center">
      <div className="flex justify-center">
        <img alt="" className="h-32 " src={logoLg} />
      </div>
      <Title size="lg">{heading}</Title>
    </div>
  );
}
