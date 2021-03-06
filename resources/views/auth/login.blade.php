@extends('layouts.pivot')

@section('content')


                    <form class="w75 textLeft" role="form" method="POST" action="{{ route('login') }}">
                        {{ csrf_field() }}

                        <div class="row1{{ $errors->has('email') ? ' has-error' : '' }}">
                            <label for="email" class="w33">E-Mail Address</label>

                            <div class="w67">
                                <input id="email" class="w67" type="email" name="email" value="{{ old('email') }}" required autofocus>

                                @if ($errors->has('email'))
                                    <span class="help-block">
                                        <strong>{{ $errors->first('email') }}</strong>
                                    </span>
                                @endif
                            </div>
                        </div>

                        <div class="row1{{ $errors->has('password') ? ' has-error' : '' }}">
                            <label for="password" class="w33">Password</label>

                            <div class="w67">
                                <input id="password" class="w67" type="password" class="textinput1" name="password" required>

                                @if ($errors->has('password'))
                                    <span class="help-block">
                                        <strong>{{ $errors->first('password') }}</strong>
                                    </span>
                                @endif
                            </div>
                        </div>

                        <div class="w100">
                            <div class="w33"></div>
                            <label>
                                <input type="checkbox" class="checkbox1" name="remember" {{ old('remember') ? 'checked' : '' }}> Remember Me
                            </label>
                        </div>

                        <div class="row1">
                          <div class="w33"></div>
                          <div class="col-md-8 col-md-offset-4">
                              <button type="submit" class="">
                                  Login
                              </button>

                              <a class="a1" href="{{ route('password.request') }}">
                                  Forgot Your Password?
                              </a>
                          </div>
                        </div>
                    </form>

@endsection
