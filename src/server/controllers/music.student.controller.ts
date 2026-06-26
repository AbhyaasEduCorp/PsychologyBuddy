import { NextRequest, NextResponse } from "next/server";
import { MusicStudentService } from "../services/music.student.service";
import {
  StudentGetMusicResourcesSchema,
  StudentGetFeaturedMusicSchema,
  StudentGetMusicInstructionsSchema,
  GetSingleMusicResourceSchema,
  GetSingleMusicInstructionSchema,
} from "../validators/music.validators";
import { asyncHandler } from "../../utils/error-handler";

const musicStudentService = new MusicStudentService();

// ====================================
//        MUSIC RESOURCE CONTROLLERS
// ====================================

export const getMusicResources = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());
  const validatedData = StudentGetMusicResourcesSchema.parse(queryData);

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    ...validatedData,
    schoolId: validatedData.schoolId || (schoolId !== 'undefined' ? schoolId : undefined),
  };

  const result = await musicStudentService.getMusicResources(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const getMusicResourceById = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());
  const validatedData = GetSingleMusicResourceSchema.parse(queryData);

  const result = await musicStudentService.getMusicResourceById(validatedData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 404 });
  }
});

export const getMusicByCategory = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());

  // Validate required category parameter
  if (!queryData.category) {
    return NextResponse.json(
      {
        success: false,
        message: "Category parameter is required",
      },
      { status: 400 }
    );
  }

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    category: queryData.category,
    goal: queryData.goal,
    schoolId: schoolId !== 'undefined' ? schoolId : undefined,
    page: queryData.page ? parseInt(queryData.page) : 1,
    limit: queryData.limit ? parseInt(queryData.limit) : 20,
  };

  const result = await musicStudentService.getMusicByCategory(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const getMusicByGoal = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());

  // Validate required goal parameter
  if (!queryData.goal) {
    return NextResponse.json(
      {
        success: false,
        message: "Goal parameter is required",
      },
      { status: 400 }
    );
  }

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    goal: queryData.goal,
    category: queryData.category,
    schoolId: schoolId !== 'undefined' ? schoolId : undefined,
    page: queryData.page ? parseInt(queryData.page) : 1,
    limit: queryData.limit ? parseInt(queryData.limit) : 20,
  };

  const result = await musicStudentService.getMusicByGoal(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const getFeaturedMusic = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());
  const validatedData = StudentGetFeaturedMusicSchema.parse(queryData);

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    ...validatedData,
    schoolId: validatedData.schoolId || (schoolId !== 'undefined' ? schoolId : undefined),
  };

  const result = await musicStudentService.getFeaturedMusic(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

// ====================================
//      MUSIC INSTRUCTION CONTROLLERS
// ====================================

export const getMusicInstructions = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());
  const validatedData = StudentGetMusicInstructionsSchema.parse(queryData);

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    ...validatedData,
    schoolId: validatedData.schoolId || (schoolId !== 'undefined' ? schoolId : undefined),
  };

  const result = await musicStudentService.getMusicInstructions(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const getMusicInstructionById = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());
  const validatedData = GetSingleMusicInstructionSchema.parse(queryData);

  const result = await musicStudentService.getMusicInstructionById(validatedData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 404 });
  }
});

export const getMusicInstructionsByDifficulty = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());

  // Validate required difficulty parameter
  if (!queryData.difficulty) {
    return NextResponse.json(
      {
        success: false,
        message: "Difficulty parameter is required",
      },
      { status: 400 }
    );
  }

  // Validate difficulty value
  const validDifficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  if (!validDifficulties.includes(queryData.difficulty)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid difficulty level. Must be one of: BEGINNER, INTERMEDIATE, ADVANCED",
      },
      { status: 400 }
    );
  }

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    difficulty: queryData.difficulty,
    schoolId: schoolId !== 'undefined' ? schoolId : undefined,
    page: queryData.page ? parseInt(queryData.page) : 1,
    limit: queryData.limit ? parseInt(queryData.limit) : 20,
  };

  const result = await musicStudentService.getMusicInstructionsByDifficulty(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const getMusicInstructionsByResource = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());

  // Validate required resourceId parameter
  if (!queryData.resourceId) {
    return NextResponse.json(
      {
        success: false,
        message: "Resource ID parameter is required",
      },
      { status: 400 }
    );
  }

  const contextData = {
    resourceId: queryData.resourceId,
    page: queryData.page ? parseInt(queryData.page) : 1,
    limit: queryData.limit ? parseInt(queryData.limit) : 20,
  };

  const result = await musicStudentService.getMusicInstructionsByResource(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

// ====================================
//        MUSIC DISCOVERY CONTROLLERS
// ====================================

export const getMusicCategories = asyncHandler(async (request: NextRequest) => {
  const result = await musicStudentService.getMusicCategories();

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const getMusicGoals = asyncHandler(async (request: NextRequest) => {
  const result = await musicStudentService.getMusicGoals();

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const searchMusic = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());

  // Validate required query parameter
  if (!queryData.query) {
    return NextResponse.json(
      {
        success: false,
        message: "Search query parameter is required",
      },
      { status: 400 }
    );
  }

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    query: queryData.query,
    schoolId: schoolId !== 'undefined' ? schoolId : undefined,
    page: queryData.page ? parseInt(queryData.page) : 1,
    limit: queryData.limit ? parseInt(queryData.limit) : 20,
  };

  const result = await musicStudentService.searchMusic(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

export const getRecommendedMusic = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryData = Object.fromEntries(searchParams.entries());

  // Get user context
  const schoolId = request.headers.get('x-school-id') || undefined;

  const contextData = {
    ...queryData,
    schoolId: schoolId !== 'undefined' ? schoolId : undefined,
    limit: queryData.limit ? parseInt(queryData.limit) : 10,
  };

  const result = await musicStudentService.getRecommendedMusic(contextData);

  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 400 });
  }
});

