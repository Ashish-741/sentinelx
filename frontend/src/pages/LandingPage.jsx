/**
 * LandingPage — Stunning hero page with animated background, features, stats, and CTA.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Globe,
  Mail,
  Brain,
  Activity,
  ArrowRight,
  Zap,
  Lock,
  Eye,
  ChevronRight,
} from 'lucide-react';
import AnimatedCounter from '../components/common/AnimatedCounter';
import Button from '../components/common/Button';

// ---------- Typewriter Effect ----------
function TypewriterText({ texts, speed = 80, deleteSpeed = 40, pauseTime = 2000 }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[index];
    let timeout;

    if (!isDeleting && text === currentText) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && text === '') {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % texts.length);
      }, deleteSpeed);
    } else {
      timeout = setTimeout(() => {
        setText(isDeleting
          ? currentText.substring(0, text.length - 1)
          : currentText.substring(0, text.length + 1)
        );
      }, isDeleting ? deleteSpeed : speed);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, texts, speed, deleteSpeed, pauseTime]);

  return (
    <span className="text-electric">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// ---------- Floating Particles ----------
function Particles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-electric/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ---------- Feature Cards ----------
const features = [
  {
    icon: Globe,
    title: 'URL Scanner',
    description: 'Advanced ML-powered URL analysis that detects phishing, malware, and suspicious patterns in real-time.',
    color: 'electric',
  },
  {
    icon: Mail,
    title: 'Email Analyzer',
    description: 'NLP-based email content analysis that identifies social engineering, credential theft, and phishing attempts.',
    color: 'neon',
  },
  {
    icon: Brain,
    title: 'Threat Intelligence',
    description: 'Multi-source threat data aggregation from VirusTotal, AbuseIPDB, and WHOIS databases.',
    color: 'purple',
  },
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    description: 'Live threat feeds, automated alerts, and comprehensive audit logging for SOC teams.',
    color: 'warning',
  },
];

const colorMap = {
  electric: { bg: 'bg-electric/10', text: 'text-electric', border: 'hover:border-electric/40', glow: 'group-hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]' },
  neon: { bg: 'bg-neon/10', text: 'text-neon', border: 'hover:border-neon/40', glow: 'group-hover:shadow-[0_0_30px_rgba(0,255,136,0.15)]' },
  purple: { bg: 'bg-purple/10', text: 'text-purple', border: 'hover:border-purple/40', glow: 'group-hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'hover:border-warning/40', glow: 'group-hover:shadow-[0_0_30px_rgba(255,170,0,0.15)]' },
};

// ---------- Stats ----------
const stats = [
  { value: 10000000, label: 'URLs Scanned', suffix: '+', display: '10M+' },
  { value: 99.7, label: 'Accuracy', suffix: '%', decimals: 1 },
  { value: 50000, label: 'Threats Blocked', suffix: '+', display: '50K+' },
  { value: 24, label: 'Monitoring', suffix: '/7' },
];

// ---------- Steps ----------
const steps = [
  { num: '01', title: 'Submit', desc: 'Paste a URL, email, or IP address for analysis', icon: Zap },
  { num: '02', title: 'Analyze', desc: 'Our AI models process and score the threat level', icon: Brain },
  { num: '03', title: 'Protect', desc: 'Get instant results with detailed threat reports', icon: Lock },
];

// ---------- Main Component ----------
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(124,58,237,0.06),transparent_50%)]" />
      <Particles />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-electric/20 flex items-center justify-center neon-glow-blue">
            <ShieldCheck className="w-5 h-5 text-electric" />
          </div>
          <span className="text-xl font-bold text-gradient">SentinelX</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-electric transition-colors">Features</a>
          <a href="#stats" className="hover:text-electric transition-colors">Stats</a>
          <a href="#how-it-works" className="hover:text-electric transition-colors">How It Works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric/10 border border-electric/20 text-sm text-electric mb-8">
            <Eye className="w-4 h-4" />
            <span>AI-Powered Cybersecurity Platform</span>
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="text-slate-100">Next-Gen </span>
          <br className="hidden sm:block" />
          <TypewriterText
            texts={['Threat Detection', 'Phishing Defense', 'Email Security', 'URL Analysis']}
          />
        </motion.h1>

        <motion.p
          className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Protect your organization with enterprise-grade AI that detects phishing URLs,
          analyzes suspicious emails, and aggregates global threat intelligence — all in real time.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={() => navigate('/signup')}
            className="neon-glow-blue"
          >
            Get Started Free
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={Activity}
            onClick={() => navigate('/login')}
          >
            Watch Demo
          </Button>
        </motion.div>

        {/* Hero glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-electric/5 blur-[120px] pointer-events-none" />
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-20">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
            Enterprise Security Features
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Comprehensive threat detection powered by machine learning and real-time intelligence feeds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => {
            const colors = colorMap[feature.color];
            return (
              <motion.div
                key={feature.title}
                className={`group glass-card p-6 border border-white/5 ${colors.border} ${colors.glow} transition-all duration-300 cursor-pointer`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section id="stats" className="relative z-10 px-6 lg:px-12 py-20">
        <div className="max-w-4xl mx-auto glass-card p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-electric mb-1">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                    duration={2500}
                  />
                </div>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="relative z-10 px-6 lg:px-12 py-20">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Three simple steps to comprehensive threat detection.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-electric/50 via-purple/50 to-neon/50" />

            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
              >
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-surface border border-slate-700/50 mb-6 mx-auto">
                  <step.icon className="w-10 h-10 text-electric" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-electric/20 border border-electric/30 flex items-center justify-center text-xs font-bold text-electric">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="relative z-10 px-6 lg:px-12 py-20">
        <motion.div
          className="max-w-3xl mx-auto text-center glass-card p-12 border border-electric/20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
            Ready to Secure Your Organization?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join thousands of security teams using SentinelX to detect and prevent cyber threats.
          </p>
          <Button
            variant="primary"
            size="lg"
            icon={ChevronRight}
            onClick={() => navigate('/signup')}
            className="neon-glow-blue"
          >
            Start Protecting Now
          </Button>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
<footer className="relative z-10 border-t border-slate-800/50 px-6 lg:px-12 py-12">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-electric/20 flex items-center justify-center">
        <ShieldCheck className="w-4 h-4 text-electric" />
      </div>
      <span className="font-bold text-gradient">SentinelX</span>
      <span className="text-sm text-slate-500">© {new Date().getFullYear()}</span>
    </div>

    <div className="flex items-center gap-6 text-sm text-slate-500">
      <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
      <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
      <a href="#" className="hover:text-slate-300 transition-colors">Docs</a>
      <a href="#" className="hover:text-slate-300 transition-colors">API</a>
    </div>

    <div className="flex items-center gap-3">
      <a
        href="#"
        className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Globe className="w-4 h-4" />
      </a>

      <a
        href="#"
        className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Mail className="w-4 h-4" />
      </a>

      <a
        href="#"
        className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ShieldCheck className="w-4 h-4" />
      </a>
    </div>
  </div>
</footer>
    </div>
  );
}
