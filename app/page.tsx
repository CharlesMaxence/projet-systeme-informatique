"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [explication, setExplication] = useState("");
  const [titreExplication, setTitreExplication] = useState("");
  const [afficherExplication, setAfficherExplication] = useState(false);
  const [couleurAlerte, setCouleurAlerte] = useState("");
  const [score, setScore] = useState(0);
  const [questionsRatees, setQuestionsRatees] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerActif, setTimerActif] = useState(false);
  const [joueurPret, setJoueurPret] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showResetButton, setShowResetButton] = useState(false);

  const question = questions[questionIndex];

  /* ===== PROGRESSION ===== */
  const scoreProgression =
    questionIndex > 0 ? Math.round((score / questionIndex) * 100) : 0;

  /* ===== INCREMENT NBRFAUTES ===== */
  async function incrementNbrFautes(questionId: number) {
    const { data, error } = await supabase.rpc("increment_nbrfautes", {
      qid: questionId,
    });

    if (error) {
      console.error("Erreur Supabase nbrfautes :", error);
      return;
    }

    console.log("nbrfautes incrémenté avec succès", data);

    // mise à jour locale
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, nbrfautes: (q.nbrfautes || 0) + 1 }
          : q
      )
    );
  }

  /* ===== RESET NBRFAUTES ===== */
  async function resetAllNbrFautes() {
    const { error } = await supabase
      .from("question")
      .update({ nbrfautes: 0 })
      .neq("id", 0); // Update all rows

    if (error) {
      console.error("Erreur lors de la réinitialisation :", error);
      alert("Erreur lors de la réinitialisation des statistiques");
      return;
    }

    // Mise à jour locale
    setQuestions((prev) =>
      prev.map((q) => ({ ...q, nbrfautes: 0 }))
    );

    alert("Toutes les statistiques ont été réinitialisées à 0");
    setShowResetButton(false);
    setClickCount(0);
  }

  /* ===== FETCH QUESTIONS ===== */
  useEffect(() => {
    async function fetchQuestion() {
      const { data } = await supabase
        .from("question")
        .select(`
          id,
          texte,
          image_url,
          image_credit_nom,
          image_credit_url,
          explication,
          nbrfautes,
          reponses:reponse (
            id,
            texte,
            est_correcte
          )
        `)
        .order("id", { ascending: true });

      setQuestions(data || []);
    }

    fetchQuestion();
  }, []);

  /* ===== TIMER RESET ===== */
  useEffect(() => {
    if (!joueurPret) return;
    setTimeLeft(10);
    setTimerActif(true);
  }, [questionIndex, joueurPret]);

  /* ===== TIMER ===== */
  useEffect(() => {
    if (!question || !timerActif || !joueurPret) return;

    if (timeLeft === 0) {
      setTimerActif(false);

      setQuestionsRatees((prev) => [
        ...prev,
        { question: question.texte, explication: question.explication },
      ]);

      setTitreExplication("Temps écoulé");
      setExplication("Vous n'avez pas répondu à temps.");
      setCouleurAlerte("bg-rose-50 border-rose-400 text-rose-800");
      setAfficherExplication(true);

      incrementNbrFautes(question.id);

      setTimeout(() => {
        setAfficherExplication(false);
        setQuestionIndex((prev) => prev + 1);
      }, 3000);

      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, question, timerActif, joueurPret]);

  /* ===== CLICK ===== */
  function handleClick(reponse: any) {
    if (afficherExplication) return;

    setTimerActif(false);
    const bonne = reponse.est_correcte;

    setTitreExplication(bonne ? "Bonne réponse" : "Mauvaise réponse");
    setExplication(question.explication || "");
    setCouleurAlerte(
      bonne
        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
        : "bg-rose-50 border-rose-400 text-rose-800"
    );

    if (!bonne) {
      setQuestionsRatees((prev) => [
        ...prev,
        { question: question.texte, explication: question.explication },
      ]);

      incrementNbrFautes(question.id);
    }

    setAfficherExplication(true);

    setTimeout(() => {
      setAfficherExplication(false);
      if (bonne) setScore((s) => s + 1);
      setQuestionIndex((i) => i + 1);
    }, 3500);
  }

  function resetQuiz() {
    setQuestionIndex(0);
    setScore(0);
    setQuestionsRatees([]);
    setTimerActif(false);
    setJoueurPret(false);
  }

  /* ===== HIDDEN RESET TRIGGER ===== */
  function handleTitleClick() {
    setClickCount((prev) => prev + 1);
    if (clickCount + 1 >= 5) {
      setShowResetButton(true);
    }
  }

  /* ===== ACCUEIL ===== */
  if (!joueurPret) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 px-4">
        <Alert className="max-w-xl bg-emerald-50 border-emerald-400 text-emerald-900 mb-6">
          <AlertTitle 
            className="text-2xl font-bold cursor-pointer select-none"
            onClick={handleTitleClick}
          >
            CyberQuiz
          </AlertTitle>
          <AlertDescription>
            Quiz chronométré en cybersécurité de 21 questions fait par Maxence Charles, élève BTS
            SIO 1ère année
          </AlertDescription>
        </Alert>

        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setJoueurPret(true)}
        >
          Commencer le quiz
        </Button>

        {/* ===== BOUTON RESET CACHÉ ===== */}
        {showResetButton && (
          <Button
            size="sm"
            variant="destructive"
            className="mt-4"
            onClick={resetAllNbrFautes}
          >
            🔄 Réinitialiser toutes les statistiques
          </Button>
        )}

        {/* ===== STATISTIQUES DES FAUTES ===== */}
        {questions.length > 0 && (
          <div className="mt-10 max-w-xl w-full">
            <h3 className="text-xl font-bold text-slate-700 mb-4 text-center">
              Statistiques des fautes par question (actualiser la page pour mettre à jour)
            </h3>

            <div className="space-y-2">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="flex justify-between items-center p-3 border rounded bg-slate-50"
                >
                  <span className="font-medium">
                    Question {index + 1}
                  </span>
                  <span className="text-rose-700 font-bold">
                    {q.nbrfautes || 0} faute{(q.nbrfautes || 0) > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ===== FIN ===== */
  if (!question) {
    return (
      <div className="text-center mt-16">
        <h2 className="text-3xl font-bold text-emerald-700">
          Quiz terminé
        </h2>

        <p className="mt-4 text-lg">
          Score : <b>{score}</b> / {questions.length}
        </p>

        {questionsRatees.length > 0 ? (
          <div className="mt-10 max-w-2xl mx-auto">
            {questionsRatees.map((q, i) => (
              <div
                key={i}
                className="mb-4 p-4 border border-rose-300 bg-rose-50 rounded"
              >
                <p className="font-bold text-rose-700">{q.question}</p>
                <p className="text-sm mt-2">{q.explication}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-emerald-600 font-semibold">
            Aucune erreur
          </p>
        )}

        <Button
          className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={resetQuiz}
        >
          Rejouer
        </Button>
      </div>
    );
  }

  /* ===== QUIZ ===== */
  return (
    <Card className="max-w-4xl mx-auto mt-10 border-emerald-300">
      <div className="flex">
        <div className="w-1/2 p-4">
          {question.image_url ? (
            <div>
              <Image
                src={question.image_url}
                alt="Illustration"
                width={400}
                height={300}
                className="rounded"
              />
              {question.image_credit_nom && (
                <p className="text-xs text-slate-500 mt-2">
                  Crédit image :{" "}
                  {question.image_credit_url ? (
                    <a
                      href={question.image_credit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-slate-700"
                    >
                      {question.image_credit_nom}
                    </a>
                  ) : (
                    question.image_credit_nom
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="h-[300px] bg-slate-100 flex items-center justify-center rounded">
              Pas d'image
            </div>
          )}
        </div>

        <div className="w-1/2 p-4">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>
                Score : {score} / {questionIndex || 1}
              </span>
              <span>{scoreProgression}%</span>
            </div>

            <div className="w-full h-2 bg-slate-200 rounded">
              <div
                className="h-2 bg-emerald-500 rounded transition-all duration-300"
                style={{ width: `${scoreProgression}%` }}
              />
            </div>
          </div>

          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-emerald-700">
              Question {questionIndex + 1}
            </CardTitle>
          </CardHeader>

          <p className="text-right text-sm text-slate-600 mb-2">
            ⏱ {timeLeft}s
          </p>

          <CardContent className="p-0">
            <p className="text-lg font-semibold mb-4">
              {question.texte}
            </p>

            {question.reponses.map((r: any) => (
              <Button
                key={r.id}
                onClick={() => handleClick(r)}
                disabled={afficherExplication}
                className="w-full mt-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                variant="outline"
              >
                {r.texte}
              </Button>
            ))}
          </CardContent>

          {afficherExplication && (
            <Alert className={`mt-6 ${couleurAlerte}`}>
              <AlertTitle>{titreExplication}</AlertTitle>
              <AlertDescription>{explication}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </Card>
  );
}
