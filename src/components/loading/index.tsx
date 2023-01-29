import Lottie from 'react-lottie-player';

import * as Animation from "../../assets/loading.json"

export function LoadingHeron() {
  return (
<div className='flex items-center justify-center'>
<Lottie
    loop
    animationData={Animation}
    play
    style={{ width: 200, height: 200 }}
  />
</div>
  );
}
