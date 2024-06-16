import Alert from '@/components/Alert';
import '@/styles/fonts.css';
import '@/styles/main.css';

export default function App({ Component, pageProps }) {
	return (
		<>
			<Component {...pageProps} />
			<Alert />
		</>
	);
}
