export interface QuizOptionInput {
	label: string;
	value?: string;
	description?: string;
}

export interface QuizOption {
	label: string;
	value: string;
	description?: string;
}

export interface PreparedQuiz {
	options: QuizOption[];
	correctIndex: number;
}

export function prepareQuiz(
	input: readonly QuizOptionInput[],
	correctAnswer: string,
	shuffle = true,
	random: () => number = Math.random,
): PreparedQuiz {
	if (input.length < 2 || input.length > 6)
		throw new Error("quiz requires 2-6 options");

	const seen = new Set<string>();
	const options = input.map((option) => {
		const label = option.label.trim();
		if (!label) throw new Error("quiz option labels cannot be empty");
		const value = option.value?.trim() || label;
		if (seen.has(value)) throw new Error(`duplicate quiz value: ${value}`);
		seen.add(value);
		return {
			label,
			value,
			description: option.description?.trim() || undefined,
		};
	});

	const answer = correctAnswer.trim();
	if (!answer || !seen.has(answer))
		throw new Error("correctAnswer must match an option value");

	if (shuffle) {
		for (let index = options.length - 1; index > 0; index--) {
			const target = Math.floor(random() * (index + 1));
			[options[index], options[target]] = [options[target], options[index]];
		}
	}

	return {
		options,
		correctIndex: options.findIndex((option) => option.value === answer),
	};
}
