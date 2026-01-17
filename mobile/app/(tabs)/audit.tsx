import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Activity, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Logic mirrored from web app
const ASSESSMENT_QUESTIONS = [
  {
    id: 1, category: 'eat', question: 'How often do you consume Vegetables/Fruits?',
    options: [{ label: 'Never', score: 0 }, { label: '1xWeek', score: 5 }, { label: '2-3xWeek', score: 15 }, { label: 'Daily', score: 25 }]
  },
  {
    id: 2, category: 'eat', question: 'How often do you consume Soft Drinks?',
    options: [{ label: 'Never', score: 25 }, { label: '1xWeek', score: 15 }, { label: '2-3xWeek', score: 5 }, { label: 'Daily', score: 0 }]
  },
  {
    id: 3, category: 'eat', question: 'How often do you consume Packaged Foods (Maggi, Digestive Cookies)?',
    options: [{ label: 'Never', score: 25 }, { label: '1xWeek', score: 15 }, { label: '2-3xWeek', score: 5 }, { label: 'Daily', score: 0 }]
  },
  {
    id: 4, category: 'eat', question: 'How often do you consume Processed Foods?',
    options: [{ label: 'Never', score: 25 }, { label: 'Rarely', score: 20 }, { label: 'Sometimes', score: 10 }, { label: 'Often', score: 5 }, { label: 'Always', score: 0 }]
  },
  {
    id: 5, category: 'eat', question: 'How often do you consume Fast Food (Samosa, Noodles, Burger, Momos)?',
    options: [{ label: 'Never', score: 25 }, { label: '1xWeek', score: 15 }, { label: '2-3xWeek', score: 5 }, { label: 'Daily', score: 0 }]
  },
  {
    id: 6, category: 'eat', question: 'How often do you consume Tea/Coffee (20ml)?',
    options: [{ label: 'Never', score: 25 }, { label: '1xWeek', score: 20 }, { label: '2-3xWeek', score: 10 }, { label: '> 3X Day', score: 0 }]
  },
  {
    id: 7, category: 'eat', question: 'How often do you consume Refined Oil?',
    options: [{ label: 'Never', score: 25 }, { label: '1-2xWeek', score: 15 }, { label: '3-4xWeek', score: 5 }, { label: 'Daily', score: 0 }]
  },
  {
    id: 8, category: 'lifestyle', question: 'What is your daily water intake?',
    options: [{ label: '1-4 Glasses', score: 5 }, { label: '5-8 Glasses', score: 15 }, { label: '8-12 Glasses', score: 25 }, { label: '> 12 Glasses', score: 20 }]
  },
  {
    id: 9, category: 'lifestyle', question: 'Do you read the ingredients on everything you consume?',
    options: [{ label: 'Yes', score: 25 }, { label: 'Sometimes', score: 15 }, { label: 'No', score: 5 }, { label: "Don't Care", score: 0 }]
  },
  {
    id: 10, category: 'eat', question: 'How much sugar do you consume in a typical day? (1 Tbsp - 15 gm)',
    options: [{ label: '0-2 Tbsp', score: 25 }, { label: '2-3 Tbsp', score: 10 }, { label: '> 3 Tbsp', score: 0 }, { label: 'Sugar Free/Substitute', score: 20 }]
  },
  {
    id: 11, category: 'lifestyle', question: 'Do you smoke?',
    options: [{ label: 'Yes', score: 0 }, { label: 'No', score: 25 }, { label: 'I have quit', score: 15 }]
  },
  {
    id: 12, category: 'lifestyle', question: 'Do you consume alcohol?',
    options: [{ label: 'Yes', score: 0 }, { label: 'No', score: 25 }, { label: 'Socially', score: 15 }]
  },
  {
    id: 13, category: 'lifestyle', question: 'When you start feeling unwell like a cold, you?',
    options: [{ label: 'Take home remedy', score: 25 }, { label: 'Take a Medicine', score: 10 }, { label: 'Call the doctor', score: 5 }, { label: 'Ignore it', score: 0 }]
  },
  {
    id: 14, category: 'lifestyle', question: 'Do you use any of the following in your kitchen?',
    options: [{ label: 'Plastic Storage Boxes', score: 5 }, { label: 'Teflon Coating Cookware', score: 5 }, { label: 'Aluminium Foil', score: 5 }, { label: 'None of these', score: 25 }]
  },
  {
    id: 15, category: 'lifestyle', question: 'How frequently do you fall sick?',
    options: [{ label: 'Once a week', score: 0 }, { label: 'Once a month', score: 5 }, { label: 'Once in few months', score: 15 }, { label: 'Once in a Year', score: 25 }]
  },
  {
    id: 16, category: 'lifestyle', question: 'Do you have any of the following disease?',
    options: [{ label: 'Diabetes/PCOD/Thyroid/Hypertension', score: 5 }, { label: 'IBS/Constipation/Fatty Liver', score: 10 }, { label: 'Arthiritis/Osteoperosis', score: 15 }, { label: 'No', score: 25 }]
  },
  {
    id: 17, category: 'lifestyle', question: 'Have you lost weight earlier?',
    options: [{ label: 'Gained & Lost Several Times', score: 5 }, { label: 'Gained and Lost Once', score: 15 }, { label: 'Gained weight for the First Time', score: 25 }]
  },
  {
    id: 18, category: 'mind', question: 'Do you feel low in energy or are often fatigue?',
    options: [{ label: 'Never', score: 25 }, { label: 'Rarely', score: 15 }, { label: 'Occasionally', score: 5 }, { label: 'Often', score: 0 }]
  },
  {
    id: 19, category: 'mind', question: 'Are you stressed?',
    options: [{ label: 'Yes, all the time', score: 0 }, { label: 'Sometimes', score: 10 }, { label: 'It comes and goes, no worries', score: 20 }, { label: 'No, not really', score: 25 }]
  },
  {
    id: 20, category: 'mind', question: 'How much sleep do you get?',
    options: [{ label: '4-5 hours', score: 5 }, { label: '6-7 hours', score: 15 }, { label: '8-10hours', score: 25 }, { label: '< 4 hours', score: 0 }]
  },
  {
    id: 21, category: 'exercise', question: 'Do you exercise?',
    options: [{ label: '2 Times a Week', score: 10 }, { label: '3-4 Times a Week', score: 20 }, { label: 'No', score: 0 }, { label: '5 or more times a Week', score: 25 }]
  },
  {
    id: 22, category: 'exercise', question: 'How is your general day like?',
    options: [{ label: 'Sedentary (No Movement)', score: 0 }, { label: 'Somewhat Active (Example Household chores etc.)', score: 15 }, { label: 'Very Active (Example - On feet at work)', score: 25 }]
  },
  {
    id: 23, category: 'exercise', question: 'Which of these do you prefer?',
    options: [{ label: 'Running/Yoga', score: 25 }, { label: 'Strength Training', score: 25 }, { label: 'Cardio', score: 15 }, { label: "Don't Exercise", score: 0 }]
  }
];

export default function WellnessAuditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const data = await api.get('/api/clients/me/health-assessment');
      setAssessment(data);
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (score: number, index: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentStep] = {
      questionId: ASSESSMENT_QUESTIONS[currentStep].id,
      score,
      answerIndex: index
    };
    setUserAnswers(newAnswers);

    if (currentStep < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment(newAnswers);
    }
  };

  const submitAssessment = async (answers: any[]) => {
    setLoading(true);
    const categoryScores = { eat: 0, lifestyle: 0, mind: 0, exercise: 0 };
    let totalRawScore = 0;

    answers.forEach((ans, idx) => {
      const question = ASSESSMENT_QUESTIONS[idx];
      (categoryScores as any)[question.category] += ans.score;
      totalRawScore += ans.score;
    });

    const totalScore = Math.round((totalRawScore / (ASSESSMENT_QUESTIONS.length * 25)) * 100);
    let riskLevel = 'Awesome';
    if (totalScore <= 30) riskLevel = 'Excessive Risk';
    else if (totalScore <= 40) riskLevel = 'Weak Areas';
    else if (totalScore <= 60) riskLevel = 'Serious';
    else if (totalScore <= 75) riskLevel = 'Improvement';
    else if (totalScore <= 89) riskLevel = 'Better';

    try {
      console.log('Submitting audit payload:', { answers, categoryScores, totalScore, riskLevel });
      const result = await api.post('/api/clients/me/health-assessment', {
        answers,
        categoryScores,
        totalScore,
        riskLevel
      });
      setAssessment(result);
      setIsQuizActive(false);
      // Reset state for potential retakes
      setCurrentStep(0);
      setUserAnswers([]);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isQuizActive) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Activity size={40} color={theme.brandSage} />
      </View>
    );
  }

  if (isQuizActive) {
    const question = ASSESSMENT_QUESTIONS[currentStep];
    const progress = (currentStep + 1) / ASSESSMENT_QUESTIONS.length;

    return (
      <View style={[styles.quizContainer, { backgroundColor: theme.background, paddingTop: insets.top + 24 }]}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setIsQuizActive(false)}>
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.quizTitle, { color: theme.brandForest }]}>Audit Progress</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.progressBarBase}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: theme.brandSage }]} />
        </View>

        <View style={styles.questionSection}>
          <Text style={styles.categoryLabel}>{question.category.toUpperCase()}</Text>
          <Text style={[styles.questionText, { color: theme.brandForest }]}>{question.question}</Text>

          <View style={styles.optionsList}>
            {question.options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.optionButton, { borderColor: theme.brandSage + '20' }]}
                onPress={() => handleAnswer(opt.score, idx)}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>{opt.label}</Text>
                <ChevronRight size={18} color={theme.brandSage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 24 }]}>
      <View style={styles.landingHeader}>
        <Text style={[styles.title, { color: theme.brandForest }]}>Wellness Audit</Text>
        <Text style={styles.subtitle}>Insights into your metabolic health</Text>
      </View>

      {assessment ? (
        <View style={styles.resultCard}>
          <View style={[styles.scoreCircle, { borderColor: theme.brandSage }]}>
            <Text style={[styles.scoreValue, { color: theme.brandForest }]}>{assessment.totalScore}</Text>
            <Text style={styles.scoreUnit}>Score</Text>
          </View>
          <Text style={[styles.riskLevel, { color: theme.brandEarth }]}>{assessment.riskLevel}</Text>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: theme.brandForest, marginBottom: 12 }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.buttonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.brandSage }]}
            onPress={() => {
              setIsQuizActive(true);
              setCurrentStep(0);
              setUserAnswers([]);
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.brandSage }]}>Retake Audit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ctaCard}>
          <Activity size={48} color={theme.brandSage} />
          <Text style={[styles.ctaTitle, { color: theme.brandForest }]}>How healthy are you?</Text>
          <Text style={styles.ctaText}>Take our 2-minute audit to uncover metabolic barriers.</Text>
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: theme.brandSage }]}
            onPress={() => {
              setIsQuizActive(true);
              setCurrentStep(0);
            }}
          >
            <Text style={styles.buttonText}>Start Audit</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  landingHeader: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '900' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4, fontWeight: '500' },
  ctaCard: { padding: 40, borderRadius: 40, backgroundColor: '#F0F5F3', alignItems: 'center', gap: 20 },
  ctaTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  ctaText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  mainButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
  resultCard: { alignItems: 'center', padding: 32, backgroundColor: '#FFF', borderRadius: 40, shadowOpacity: 0.05, elevation: 2 },
  scoreCircle: { width: 150, height: 150, borderRadius: 75, borderWidth: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  scoreValue: { fontSize: 48, fontWeight: '900' },
  scoreUnit: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  riskLevel: { fontSize: 24, fontWeight: '900', marginBottom: 24 },
  quizContainer: { flex: 1, padding: 24 },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  quizTitle: { fontSize: 18, fontWeight: '900' },
  progressBarBase: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 40, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  questionSection: { gap: 12 },
  categoryLabel: { fontSize: 12, fontWeight: '900', color: '#94a3b8', letterSpacing: 2 },
  questionText: { fontSize: 28, fontWeight: '900', lineHeight: 36, marginBottom: 24 },
  optionsList: { gap: 12 },
  optionButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1 },
  optionText: { fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 16, width: '100%', alignItems: 'center', borderRadius: 16, borderWidth: 2, backgroundColor: 'transparent' },
  secondaryButtonText: { fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }
});
