import CustomerHome from '@/components/home/CustomerHome';

interface HomePageProps {
  onShowAuth?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onShowAuth }) => {
  return <CustomerHome onShowAuth={onShowAuth} />;
};

export default HomePage;