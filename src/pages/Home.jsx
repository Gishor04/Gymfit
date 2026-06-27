import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import Services from '../components/Services'
import Membership from '../components/Membership'
import Trainers from '../components/Trainers'
import Community from '../components/Community'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Membership />
      <Trainers />
      <Community />
      <Contact />
      <Footer />
    </>
  )
}
