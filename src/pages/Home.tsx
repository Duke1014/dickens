import Sponsors from '../components/Sponsors';
// @ts-ignore
import DickensCover from '../assets/DickensCover.jpg';
import '../styles/home.css';

export default function Home() {
  return (
    <div className="home">
      <h1>Home</h1>
      <section className='cover'>
        <img src={DickensCover} alt="Dickens Christmas in Skaneateles" style={{ maxWidth: '100%', height: 'auto' }} />
        there should be an image here
      </section>
      <Sponsors />
    </div>
  );
}