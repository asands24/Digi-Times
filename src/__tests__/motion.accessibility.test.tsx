import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Reveal, RouteMotion } from '../components/Motion';

it('shows reveal content immediately without observing when reduced motion is requested', () => {
  const previous=window.matchMedia;
  const observer=window.IntersectionObserver;
  const constructor=jest.fn();
  window.matchMedia=jest.fn().mockReturnValue({matches:true});
  window.IntersectionObserver=constructor as any;
  try {
    const {container}=render(<Reveal><button>Read a memory</button></Reveal>);
    expect(container.querySelector('.dt-reveal')).not.toHaveClass('dt-reveal--waiting');
    expect(constructor).not.toHaveBeenCalled();
  } finally {window.matchMedia=previous;window.IntersectionObserver=observer;}
});
it('uses instant hash navigation under reduced motion', () => {
  const previous=window.matchMedia;
  const originalScroll=HTMLElement.prototype.scrollIntoView;
  const scroll=jest.fn();HTMLElement.prototype.scrollIntoView=scroll;
  window.matchMedia=jest.fn().mockReturnValue({matches:true});
  const frame=jest.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{callback(0);return 1;});
  try {
    render(<MemoryRouter initialEntries={['/#create-story']}><RouteMotion><section id="create-story">Create</section></RouteMotion></MemoryRouter>);
    expect(scroll).toHaveBeenCalledWith({behavior:'auto',block:'start'});
  } finally {frame.mockRestore();window.matchMedia=previous;HTMLElement.prototype.scrollIntoView=originalScroll;}
});
