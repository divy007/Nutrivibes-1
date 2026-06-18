import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from '@/components/home/home.module.css';

export default function HomeHero() {
  return (
    <section className={styles.heroSection}>
      {/* Gradient background and decorative circles */}
      <div className={styles.decorTop} />
      <div className={styles.decorBottom} />

      <div className={styles.container}>
        <div className={styles.textBlock}>
          <div className={styles.badge}>Now Live on App Store &amp; Play Store</div>
          <h1 className={styles.title}>
            Your Personal <br />
            <span className={styles.gradientText}>Wellness Journey</span>
            <br />
            Starts Here.
          </h1>
          <p className={styles.subTitle}>
            Connect directly with Dt. Mansi Anajwala. Get personalized diet plans, track your progress, and achieve your health goals.
          </p>
          <div className={styles.ctaGroup}>
            <a
              href="https://play.google.com/store/apps/details?id=com.nutrivibes.mobile"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaButton}
            >
              Get the App
            </a>
            <Link href="/login" className={styles.loginButton}>
              Staff Login <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
        {/* Mock mobile phone preview */}
        <div className={styles.phoneMock}>
          <Image
            src="/app-login-screen.png"
            alt="DateWithDiet App Screen"
            width={300}
            height={600}
            className={styles.phoneImage}
            priority
          />
        </div>
      </div>
    </section>
  );
}
