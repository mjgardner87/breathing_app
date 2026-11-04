import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {RouteProp, useFocusEffect, useNavigation, usePreventRemove, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {activate, deactivate} from '@thehale/react-native-keep-awake';
import {v4 as uuidv4} from 'uuid';
import {BreathingCircle} from '../components/BreathingCircle';
import {DEFAULT_PREFERENCES, resolvePreferences} from '../constants/defaults';
import {useTheme} from '../context/ThemeContext';
import {useGuidedSession, GuidedPhase} from '../hooks/useGuidedSession';
import {useSessionSaver, SaveStatus} from '../hooks/useSessionSaver';
import {RootStackParamList} from '../navigation/AppNavigator';
import {StorageService} from '../services/StorageService';
import {SessionData} from '../types';
import {formatTime} from '../utils/statsCalculator';

const PHASE_TITLES: Record<GuidedPhase, string> = {
  ready: 'Make yourself comfortable', preparing: 'Settle in', breathing: 'Follow your breath',
  holding: 'Rest after the exhale', 'recovery-inhale': 'Take a full breath in',
  recovery: 'Hold gently', settling: 'Breathe naturally',
  interrupted: 'Take a moment', complete: 'Practice complete',
};

export const Session: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Session'>>();
  const mode = route.params?.mode ?? 'retention';
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const {save, retry} = useSessionSaver();
  const session = useGuidedSession(prefs, mode);
  const {state, holdTimes, durationSeconds, startedAt} = session;
  const savedData = useRef<SessionData | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    StorageService.getPreferences().then(data => {
      if (mounted.current) { setPrefs(resolvePreferences(data)); setLoading(false); }
    });
    return () => { mounted.current = false; };
  }, []);
  useFocusEffect(useCallback(() => {
    activate();
    return () => deactivate();
  }, []));

  useEffect(() => {
    if (state.phase !== 'complete' || saveStatus !== 'idle') { return; }
    if ((mode === 'retention' && holdTimes.length === 0) ||
        (mode === 'gentle' && durationSeconds === 0)) {
      setSaveStatus('saved');
      return;
    }
    const data: SessionData = {
      id: uuidv4(), date: startedAt.current ?? new Date().toISOString(),
      completedRounds: holdTimes.length, holdTimes, settings: prefs, mode, durationSeconds,
    };
    savedData.current = data;
    setSaveStatus('saving');
    save(data).then(success => {
      if (mounted.current) { setSaveStatus(success ? 'saved' : 'error'); }
    });
  }, [state.phase, saveStatus, mode, holdTimes, durationSeconds, startedAt, prefs, save]);

  const retrySave = async () => {
    if (!savedData.current) { return; }
    setSaveStatus('saving');
    const success = await retry(savedData.current);
    if (mounted.current) { setSaveStatus(success ? 'saved' : 'error'); }
  };
  const active = state.phase !== 'ready' && state.phase !== 'complete' && state.phase !== 'interrupted';
  usePreventRemove(active || state.phase === 'interrupted' || saveStatus === 'saving', () => {
    if (saveStatus !== 'saving') { session.finishEarly(); }
  });
  const primary = (label: string, onPress: () => void, disabled = false) => (
    <TouchableOpacity accessibilityRole="button" style={[styles.primary, disabled && styles.disabled]}
      onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
  const secondary = (label: string, onPress: () => void) => (
    <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={onPress}>
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={theme.colours.text} /></View>;
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16}]}>
      <View style={styles.header}>
        <Text style={styles.mode}>{mode === 'gentle' ? 'Gentle breathing' : 'Guided breathing'}</Text>
        {state.phase !== 'complete' && <TouchableOpacity accessibilityRole="button" style={styles.endButton}
          onPress={active || state.phase === 'interrupted' ? session.finishEarly : () => navigation.goBack()}>
          <Text style={styles.endText}>{active ? 'End session' : 'Back'}</Text>
        </TouchableOpacity>}
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{state.paused ? 'Paused' : PHASE_TITLES[state.phase]}</Text>
        {mode === 'retention' && active &&
          <Text style={styles.meta}>Round {state.round} of {prefs.numberOfRounds}</Text>}

        {state.phase === 'ready' && <>
          <Text style={styles.body}>Sit or lie down somewhere safe. Keep your shoulders and jaw relaxed.</Text>
          <Text style={styles.body}>{mode === 'gentle'
            ? 'Five minutes of light, slow breathing, with no breath holds. Follow your own rhythm whenever you prefer.'
            : prefs.breathsPerRound + ' breaths per round · ' + prefs.numberOfRounds + ' rounds. Breathe in whenever you need to during retention.'}</Text>
          <Text style={styles.note}>Never practise retention in or near water, or while driving. Stop and breathe normally if you feel unwell.</Text>
          <Text style={styles.meta}>{prefs.guidance === 'learn' ? 'Learn: full explanations' : prefs.guidance === 'guided' ? 'Guided: occasional reminders' : 'Minimal: essential transitions'}</Text>
        </>}

        {state.phase === 'breathing' && <>
          <BreathingCircle breathCount={state.breathCount}
            totalBreaths={mode === 'gentle' ? 30 : prefs.breathsPerRound}
            isAnimating={!state.paused} direction={state.direction}
            phaseDurationMs={state.phaseDurationMs} cycleId={state.cycleId} />
          {mode === 'gentle' && <Text style={styles.meta}>{formatTime(state.seconds)} remaining</Text>}
        </>}

        {state.phase === 'holding' && <>
          <Text style={styles.body}>Breathe in at the first urge. You do not need to reach a time or feel a particular sensation.</Text>
          {prefs.minuteMarkers && <Text style={styles.timer}>{formatTime(state.seconds)}</Text>}
          <Text style={styles.note}>The button below ends retention immediately.</Text>
        </>}

        {state.phase === 'recovery' && <>
          <Text style={styles.timer}>{state.seconds}</Text>
          <Text style={styles.body}>A comfortable recovery hold. Release whenever you need.</Text>
        </>}

        {active && state.phase !== 'holding' && state.caption.length > 0 &&
          <Text style={styles.caption}>{state.caption}</Text>}
        {state.phase === 'holding' && prefs.retentionGuidance &&
          <Text style={styles.caption}>{state.caption}</Text>}
        {state.phase === 'interrupted' &&
          <Text style={styles.body}>Return to normal breathing. This round was interrupted. Your completed rounds are kept. Restart when you feel comfortable.</Text>}

        {state.phase === 'complete' && <>
          <Text style={styles.body}>Keep breathing naturally. Take your time before getting up.</Text>
          {mode === 'gentle'
            ? <Text style={styles.timer}>{formatTime(durationSeconds)}</Text>
            : <View style={styles.results}>{holdTimes.map((seconds, index) =>
              <View style={styles.result} key={index}>
                <Text style={styles.resultLabel}>Round {index + 1}</Text>
                <Text style={styles.resultValue}>{formatTime(seconds)}</Text>
              </View>)}</View>}
          {mode === 'retention' && holdTimes.length === 0 &&
            <Text style={styles.note}>No completed rounds to save.</Text>}
          <Text style={styles.note} accessibilityLiveRegion="polite">
            {saveStatus === 'saving' ? 'Saving your practice…'
              : saveStatus === 'error' ? 'Your practice has not saved. Please retry.'
              : savedData.current ? 'Your practice is saved on this device.' : ''}
          </Text>
        </>}
        {state.audioError && <Text style={styles.note} accessibilityLiveRegion="polite">{state.audioError}</Text>}
      </ScrollView>

      <View style={styles.controls}>
        {state.phase === 'ready' && primary('Begin session', session.start)}
        {state.phase === 'interrupted' && primary(mode === 'gentle' ? 'Continue gentle breathing' : 'Restart this round', session.start)}
        {state.phase === 'holding' && primary('Breathe in now', session.endHold)}
        {state.phase === 'recovery' && primary('Release now', session.releaseRecovery)}
        {state.phase === 'preparing' && !state.paused && secondary('Skip introduction', session.skipIntro)}
        {active && !['holding', 'recovery', 'recovery-inhale'].includes(state.phase) &&
          secondary(state.paused ? 'Resume' : 'Pause', session.togglePause)}
        {state.phase === 'complete' && <>
          {saveStatus === 'error' && primary('Retry saving', retrySave)}
          {saveStatus === 'error'
            ? secondary('Leave without saving', () => navigation.goBack())
            : primary(saveStatus === 'saving' ? 'Saving…' : 'Done', () => navigation.goBack(), saveStatus === 'saving')}
        </>}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {flex: 1, backgroundColor: theme.colours.background, paddingHorizontal: 24},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colours.background},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48},
  mode: {color: theme.colours.textSecondary, fontSize: 15, fontWeight: '500'},
  endButton: {minHeight: 48, minWidth: 80, alignItems: 'flex-end', justifyContent: 'center'},
  endText: {color: theme.colours.textSecondary, fontSize: 14},
  content: {flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24},
  title: {color: theme.colours.text, fontSize: 28, fontWeight: '600', textAlign: 'center', marginBottom: 12},
  meta: {color: theme.colours.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16},
  body: {color: theme.colours.text, fontSize: 17, lineHeight: 26, textAlign: 'center', marginVertical: 12, maxWidth: 460},
  caption: {color: theme.colours.textSecondary, fontSize: 16, lineHeight: 25, textAlign: 'center', marginVertical: 16, maxWidth: 460},
  note: {color: theme.colours.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center', marginVertical: 12, maxWidth: 460},
  timer: {color: theme.colours.text, fontSize: 64, fontWeight: '300', fontVariant: ['tabular-nums'], marginVertical: 24},
  controls: {gap: 10},
  primary: {backgroundColor: theme.colours.text, minHeight: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 18},
  primaryText: {color: theme.colours.background, fontSize: 18, fontWeight: '600', textAlign: 'center'},
  secondary: {minHeight: 48, borderWidth: 1, borderColor: theme.colours.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 12},
  secondaryText: {color: theme.colours.text, fontSize: 16, textAlign: 'center'},
  disabled: {opacity: 0.45},
  results: {width: '100%', maxWidth: 400, marginVertical: 20},
  result: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12},
  resultLabel: {color: theme.colours.textSecondary, fontSize: 16},
  resultValue: {color: theme.colours.text, fontSize: 18, fontVariant: ['tabular-nums']},
});
